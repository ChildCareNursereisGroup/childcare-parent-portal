// Single entry point for everything the per-branch admin screen needs:
// password login, listing/approving registrations, assigning classes, and
// saving/reading daily food-sleep-activity reports. Also lets the main admin
// (smbkfamily@gmail.com) view/change each branch's password.
//
// Branch access is gated by a short-lived session token (branch_sessions)
// issued on login, never by the anon key directly — the underlying tables
// (branch_admin_passwords, branch_sessions, classes, portal_registrations,
// daily_reports writes) have no RLS policies for anon/authenticated, so this
// function's service-role client is the only way in.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DOC_KEYS = ["father_id", "mother_id", "child_id", "child_photo", "vaccination_card", "signature", "full_form_pdf", "full_form_pdf_en"];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminEmail = (Deno.env.get("ADMIN_EMAIL") || "").toLowerCase();
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const admin = createClient(supabaseUrl, serviceKey);

  const requireBranchSession = async (token: string | undefined) => {
    if (!token) return null;
    const { data, error } = await admin
      .from("branch_sessions")
      .select("branch, expires_at")
      .eq("token", token)
      .single();
    if (error || !data) return null;
    if (new Date(data.expires_at).getTime() < Date.now()) return null;
    return data.branch as string;
  };

  const requireAdmin = async () => {
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data, error } = await authClient.auth.getUser(jwt);
    if (error || !data.user || (data.user.email || "").toLowerCase() !== adminEmail) return false;
    return true;
  };

  try {
    const body = await req.json();
    const action = body.action;

    if (action === "login") {
      const { branch, password } = body;
      if (!branch || !password) return json({ error: "بيانات ناقصة" }, 400);
      const { data: row } = await admin
        .from("branch_admin_passwords")
        .select("password")
        .eq("branch", branch)
        .maybeSingle();
      if (!row || row.password !== password) return json({ error: "باسورد غلط" }, 401);
      const { data: session, error } = await admin
        .from("branch_sessions")
        .insert({ branch })
        .select("token, expires_at")
        .single();
      if (error || !session) return json({ error: "حصل خطأ، جرّبي تاني" }, 500);
      return json({ token: session.token, expires_at: session.expires_at, branch });
    }

    if (action === "list") {
      const branch = await requireBranchSession(body.token);
      if (!branch) return json({ error: "الجلسة منتهية، سجّلي دخول تاني" }, 401);

      const { data: regs, error: regErr } = await admin
        .from("portal_registrations")
        .select("id, status, form_data, documents, contact_email, class_id, created_at, fee_adjustments")
        .eq("branch", branch)
        .order("created_at", { ascending: false });
      if (regErr) return json({ error: regErr.message }, 500);

      const withUrls = await Promise.all(
        (regs || []).map(async (r) => {
          const docs = r.documents || {};
          const document_urls: Record<string, string> = {};
          for (const key of DOC_KEYS) {
            const path = docs[key];
            if (path) {
              const { data } = await admin.storage.from("registration-documents").createSignedUrl(path, 3600);
              if (data?.signedUrl) document_urls[key] = data.signedUrl;
            }
          }
          return { ...r, document_urls };
        })
      );

      const { data: classes } = await admin
        .from("classes")
        .select("id, name")
        .eq("branch", branch)
        .order("name", { ascending: true });

      const { data: evalRows } = await admin.from("monthly_evaluations").select("registration_id, month").eq("branch", branch);
      const evalMap: Record<string, string[]> = {};
      for (const e of evalRows || []) (evalMap[e.registration_id] ||= []).push(e.month);
      const withEvals = withUrls.map((r) => ({ ...r, eval_months: evalMap[r.id] || [] }));

      return json({ branch, registrations: withEvals, classes: classes || [] });
    }

    if (action === "approve") {
      const branch = await requireBranchSession(body.token);
      if (!branch) return json({ error: "الجلسة منتهية، سجّلي دخول تاني" }, 401);
      const { registration_id } = body;
      const { data: reg, error: regErr } = await admin
        .from("portal_registrations")
        .select("*")
        .eq("id", registration_id)
        .eq("branch", branch)
        .single();
      if (regErr || !reg) return json({ error: "الطلب غير موجود" }, 404);
      if (!reg.contact_email) return json({ error: "لا يوجد بريد إلكتروني مسجل" }, 400);

      let parentUserId: string | null = reg.parent_user_id;
      if (!parentUserId) {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email: reg.contact_email,
          email_confirm: true,
        });
        if (created?.user) {
          parentUserId = created.user.id;
        } else if (createErr && !String(createErr.message).toLowerCase().includes("already been registered")) {
          return json({ error: createErr.message }, 500);
        } else {
          const { data: list } = await admin.auth.admin.listUsers();
          const existing = list?.users.find((u) => (u.email || "").toLowerCase() === reg.contact_email.toLowerCase());
          parentUserId = existing?.id || null;
        }
      }

      const { error: updateErr } = await admin
        .from("portal_registrations")
        .update({ status: "approved", parent_user_id: parentUserId })
        .eq("id", registration_id);
      if (updateErr) return json({ error: updateErr.message }, 500);

      let emailSent = false;
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "مجموعة رعاية الطفل للحضانات <login@childcareuae.com>",
            to: reg.contact_email,
            subject: "تمت الموافقة على تسجيل طفلك",
            html: `<div dir="rtl" style="font-family: sans-serif; line-height: 1.8;"><p>تمت الموافقة على طلب تسجيل طفلك في مجموعة رعاية الطفل للحضانات.</p><p>افتحي بوابة أولياء الأمور واطلبي رابط الدخول بنفس البريد الإلكتروني ده.</p></div>`,
          }),
        });
        emailSent = res.ok;
      } catch (_e) {
        emailSent = false;
      }

      return json({ ok: true, email_sent: emailSent });
    }

    if (action === "assign_class") {
      const branch = await requireBranchSession(body.token);
      if (!branch) return json({ error: "الجلسة منتهية، سجّلي دخول تاني" }, 401);
      const { registration_id, class_id, new_class_name } = body;

      let finalClassId: string | null = class_id || null;
      if (new_class_name && String(new_class_name).trim()) {
        const name = String(new_class_name).trim();
        const { data: existingClass } = await admin
          .from("classes")
          .select("id")
          .eq("branch", branch)
          .eq("name", name)
          .maybeSingle();
        if (existingClass) {
          finalClassId = existingClass.id;
        } else {
          const { data: createdClass, error: classErr } = await admin
            .from("classes")
            .insert({ branch, name })
            .select("id")
            .single();
          if (classErr) return json({ error: classErr.message }, 500);
          finalClassId = createdClass.id;
        }
      }

      const { error } = await admin
        .from("portal_registrations")
        .update({ class_id: finalClassId })
        .eq("id", registration_id)
        .eq("branch", branch);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, class_id: finalClassId });
    }

    if (action === "save_report") {
      const branch = await requireBranchSession(body.token);
      if (!branch) return json({ error: "الجلسة منتهية، سجّلي دخول تاني" }, 401);
      const { registration_id, report_date, meals, sleep, activity, notes, absent } = body;
      const { data: reg, error: regErr } = await admin
        .from("portal_registrations")
        .select("id, parent_user_id")
        .eq("id", registration_id)
        .eq("branch", branch)
        .single();
      if (regErr || !reg) return json({ error: "الطفل غير موجود" }, 404);

      const { error } = await admin.from("daily_reports").upsert(
        {
          registration_id,
          parent_user_id: reg.parent_user_id,
          branch,
          report_date: report_date || new Date().toISOString().slice(0, 10),
          absent: !!absent,
          meals: absent ? null : meals || null,
          sleep: absent ? null : sleep || null,
          activity: absent ? null : activity || null,
          notes: notes || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "registration_id,report_date" }
      );
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "set_status") {
      const branch = await requireBranchSession(body.token);
      if (!branch) return json({ error: "الجلسة منتهية، سجّلي دخول تاني" }, 401);
      const { registration_id, status } = body;
      if (!["approved", "stopped"].includes(status)) return json({ error: "حالة غير معروفة" }, 400);
      const { error } = await admin
        .from("portal_registrations")
        .update({ status })
        .eq("id", registration_id)
        .eq("branch", branch);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "delete_registration") {
      const branch = await requireBranchSession(body.token);
      if (!branch) return json({ error: "الجلسة منتهية، سجّلي دخول تاني" }, 401);
      const { registration_id } = body;
      const { data: reg, error: regErr } = await admin
        .from("portal_registrations")
        .select("documents")
        .eq("id", registration_id)
        .eq("branch", branch)
        .single();
      if (regErr || !reg) return json({ error: "الملف غير موجود" }, 404);

      const docs = reg.documents || {};
      const paths = DOC_KEYS.map((k) => docs[k]).filter((p): p is string => typeof p === "string" && p.length > 0);
      // Also remove anything else stored under this child (e.g. emailed monthly report PDFs).
      const { data: listed } = await admin.storage.from("registration-documents").list(String(registration_id));
      for (const o of listed || []) {
        const full = `${registration_id}/${o.name}`;
        if (!paths.includes(full)) paths.push(full);
      }
      if (paths.length) {
        await admin.storage.from("registration-documents").remove(paths);
      }

      const { error } = await admin
        .from("portal_registrations")
        .delete()
        .eq("id", registration_id)
        .eq("branch", branch);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "list_reports") {
      const branch = await requireBranchSession(body.token);
      if (!branch) return json({ error: "الجلسة منتهية، سجّلي دخول تاني" }, 401);
      const { registration_id } = body;
      const { data, error } = await admin
        .from("daily_reports")
        .select("*")
        .eq("registration_id", registration_id)
        .eq("branch", branch)
        .order("report_date", { ascending: false })
        .limit(30);
      if (error) return json({ error: error.message }, 500);
      return json({ reports: data || [] });
    }

    if (action === "save_fees") {
      const branch = await requireBranchSession(body.token);
      if (!branch) return json({ error: "الجلسة منتهية، سجّلي دخول تاني" }, 401);
      const { registration_id, fees } = body;
      const num = (v: unknown) => (v === "" || v === null || v === undefined || isNaN(Number(v)) || Number(v) < 0 ? null : Number(v));
      const pct = num(fees?.discount_percent);
      const clean = {
        registration_fee: num(fees?.registration_fee),
        medical_fee: num(fees?.medical_fee),
        stationery_fee: num(fees?.stationery_fee),
        uniform_fee: num(fees?.uniform_fee),
        discount_amount: num(fees?.discount_amount),
        discount_percent: pct !== null && pct <= 100 ? pct : null,
        offer_note: fees?.offer_note ? String(fees.offer_note).slice(0, 300) : null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await admin
        .from("portal_registrations")
        .update({ fee_adjustments: clean })
        .eq("id", registration_id)
        .eq("branch", branch);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, fee_adjustments: clean });
    }

    if (action === "save_evaluation") {
      const branch = await requireBranchSession(body.token);
      if (!branch) return json({ error: "الجلسة منتهية، سجّلي دخول تاني" }, 401);
      const { registration_id, month, teacher_name, ratings, observations, next_steps, flags, general_note, age_band } = body;
      if (!month) return json({ error: "الشهر مطلوب" }, 400);
      const { data: reg, error: regErr } = await admin
        .from("portal_registrations")
        .select("id, parent_user_id")
        .eq("id", registration_id)
        .eq("branch", branch)
        .single();
      if (regErr || !reg) return json({ error: "الطفل غير موجود" }, 404);

      const { error } = await admin.from("monthly_evaluations").upsert(
        {
          registration_id,
          parent_user_id: reg.parent_user_id,
          branch,
          month,
          teacher_name: teacher_name || null,
          age_band: age_band || null,
          ratings: ratings || {},
          observations: observations || {},
          next_steps: next_steps || {},
          flags: Array.isArray(flags) ? flags : [],
          general_note: general_note || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "registration_id,month" }
      );
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "send_evaluation") {
      const branch = await requireBranchSession(body.token);
      if (!branch) return json({ error: "الجلسة منتهية، سجّلي دخول تاني" }, 401);
      const { registration_id, month, reports, pdf_paths } = body;
      if (!registration_id || !month || !reports?.ar?.domains || !reports?.en?.domains) return json({ error: "بيانات ناقصة" }, 400);

      const { data: reg, error: regErr } = await admin
        .from("portal_registrations")
        .select("id, contact_email, form_data")
        .eq("id", registration_id)
        .eq("branch", branch)
        .single();
      if (regErr || !reg) return json({ error: "الطفل غير موجود" }, 404);

      const emailRe = /^\S+@\S+\.\S+$/;
      const recipients = [...new Set(
        [reg.form_data?.fEmail, reg.form_data?.mEmail, reg.contact_email]
          .map((e) => String(e || "").trim().toLowerCase())
          .filter((e) => emailRe.test(e))
      )];
      if (recipients.length === 0) return json({ error: "مفيش إيميل صحيح لولي الأمر" }, 400);

      const esc = (v: unknown) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || c));

      // Both PDFs (Arabic + English) are attached.
      const attachments: { filename: string; content: string }[] = [];
      for (const lg of ["ar", "en"] as const) {
        const path = pdf_paths?.[lg];
        if (typeof path !== "string" || !path.startsWith(`${registration_id}/`)) continue;
        const { data: file } = await admin.storage.from("registration-documents").download(path);
        if (!file) continue;
        const bytes = new Uint8Array(await file.arrayBuffer());
        let bin = "";
        for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        attachments.push({ filename: lg === "ar" ? `تقرير-نمو-${month}-عربي.pdf` : `Development-Report-${month}-English.pdf`, content: btoa(bin) });
      }

      // Email body in the language the parent used when registering.
      const L: "ar" | "en" = reg.form_data?.consentLang === "en" ? "en" : "ar";
      const en = L === "en";
      const report = reports[L];
      const T = en
        ? { dir: "ltr", side: "left", group: "Child Care Nurseries Group", title: (n: string) => `🌱 ${n}'s Development Report`, stage: "Stage", teacher: "Teacher", dear: "Dear parent,", note: "Note from the teacher:", tip: "💡 Tip for parents:",
            outro: (pdf: boolean) => `${pdf ? "PDF copies of the report (Arabic and English) are attached. " : ""}Thank you for trusting us 💛 — we're always happy to hear from you.`,
            subject: (n: string, m: string) => `🌱 ${n}'s development report — ${m}`,
            survey: "💬 Your opinion matters: please take our 5-minute quarterly parent survey in the Parent Portal (menu \"More\" → Parent survey)." }
        : { dir: "rtl", side: "right", group: "مجموعة رعاية الطفل للحضانات", title: (n: string) => `🌱 تقرير نمو ${n}`, stage: "المرحلة", teacher: "المعلمة", dear: "عزيزي ولي الأمر،", note: "ملاحظة من المعلمة:", tip: "💡 نصيحة للأهل:",
            outro: (pdf: boolean) => `${pdf ? "نسختان PDF من التقرير (عربي وإنجليزي) مرفقتان بهذا الإيميل. " : ""}شكراً لثقتكم بنا 💛 ونسعد دائماً بالتواصل معكم لأي استفسار.`,
            subject: (n: string, m: string) => `🌱 تقرير نمو ${n} — ${m}`,
            survey: "💬 رأيك يهمنا: شاركينا في استبيان الأهل ربع السنوي (5 دقائق) من بوابة أولياء الأمور — قائمة «المزيد» ← «استبيان الأهل»." };

      const domainsHtml = (report.domains as any[]).map((d) => {
        const stars = "★".repeat(d.avg || 0) + `<span style="color:#e2e8f0">${"★".repeat(5 - (d.avg || 0))}</span>`;
        const items = (d.items as any[]).map((it) => `
          <div style="border-${T.side}:4px solid ${esc(it.color)};background:#f8fafc;border-radius:8px;padding:8px 12px;margin:6px 0;">
            <div style="font-size:14px;font-weight:bold;color:${esc(it.color)};">${esc(it.skill)} — ${esc(it.levelLabel)}</div>
            <div style="font-size:15px;line-height:1.8;color:#334155;margin-top:2px;">${esc(it.message)}</div>
            ${it.tip ? `<div style="font-size:14px;line-height:1.8;color:#065f46;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:8px 12px;margin-top:6px;"><b>${T.tip}</b> ${esc(it.tip)}</div>` : ""}
          </div>`).join("");
        return `<div style="border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin:12px 0;">
          <div style="font-size:17px;font-weight:bold;margin-bottom:6px;">${esc(d.icon)} ${esc(d.title)} <span style="color:#EF9F27;float:${en ? "right" : "left"};">${stars}</span></div>${items}</div>`;
      }).join("");

      const html = `<div dir="${T.dir}" style="font-family:Tahoma,Arial,sans-serif;max-width:620px;margin:auto;color:#0f172a;line-height:1.8;">
        <div style="background:linear-gradient(135deg,#0ea5e9,#06b6d4);border-radius:16px;padding:20px;text-align:center;color:#fff;">
          <div style="font-size:14px;opacity:.9;">${T.group}</div>
          <div style="font-size:24px;font-weight:bold;margin-top:4px;">${esc(T.title(report.childName))}</div>
          <div style="font-size:14px;margin-top:4px;">${esc(report.monthLabel)}${report.bandLabel ? ` · ${T.stage}: ${esc(report.bandLabel)}` : ""}${report.teacher ? ` · ${T.teacher}: ${esc(report.teacher)}` : ""}</div>
        </div>
        <p style="font-size:16px;margin:16px 0 4px;">${T.dear}</p>
        <p style="font-size:15px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:12px 14px;">${esc(report.intro)}</p>
        ${domainsHtml}
        ${report.note ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:12px 14px;font-size:15px;"><b>${T.note}</b> ${esc(report.note)}</div>` : ""}
        <p style="font-size:15px;margin-top:16px;">${T.outro(attachments.length > 0)}</p>
        ${["03", "06", "09", "12"].includes(String(month).slice(5, 7)) ? `<p style="font-size:14px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:10px 14px;">${T.survey}<br/><a href="https://childcarenursereisgroup.github.io/childcare-parent-portal/">childcarenursereisgroup.github.io/childcare-parent-portal</a></p>` : ""}
        <p style="font-size:12px;color:#94a3b8;">${T.group}</p>
      </div>`;

      const sent: string[] = [];
      const failed: string[] = [];
      for (const to of recipients) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "مجموعة رعاية الطفل للحضانات <login@childcareuae.com>",
              to,
              subject: T.subject(report.childName, report.monthLabel),
              html,
              attachments,
            }),
          });
          if (res.ok) sent.push(to);
          else failed.push(`${to}: ${(await res.text()).slice(0, 160)}`);
        } catch (e) {
          failed.push(`${to}: ${String(e)}`);
        }
      }

      if (sent.length > 0) {
        await admin
          .from("monthly_evaluations")
          .update({ sent_at: new Date().toISOString(), sent_to: sent })
          .eq("registration_id", registration_id)
          .eq("month", month);
      }
      if (sent.length === 0) return json({ error: "فشل إرسال الإيميل", failed }, 502);
      return json({ ok: true, sent_to: sent, failed, attached: attachments.length > 0 });
    }

    // All monthly evaluations of the branch (for month-to-month progress reports).
    if (action === "list_branch_evaluations") {
      const branch = await requireBranchSession(body.token);
      if (!branch) return json({ error: "الجلسة منتهية، سجّلي دخول تاني" }, 401);
      const { data, error } = await admin
        .from("monthly_evaluations")
        .select("registration_id, month, age_band, ratings, teacher_name, flags, sent_at")
        .eq("branch", branch)
        .order("month", { ascending: true })
        .limit(5000);
      if (error) return json({ error: error.message }, 500);
      return json({ evaluations: data || [] });
    }

    // ---- Parent partnership: complaints log + survey data + monthly note ----
    if (action === "list_feedback") {
      const branch = await requireBranchSession(body.token);
      if (!branch) return json({ error: "الجلسة منتهية، سجّلي دخول تاني" }, 401);
      const [{ data: cases, error: cErr }, { data: surveys, error: sErr }, { data: notes }] = await Promise.all([
        admin.from("feedback_cases").select("*").eq("branch", branch).order("received_at", { ascending: false }).limit(2000),
        admin.from("parent_surveys").select("registration_id, period, answers, nps, positive, improve, anonymous, created_at").eq("branch", branch).order("created_at", { ascending: false }).limit(5000),
        admin.from("partnership_notes").select("month, you_said_we_did").eq("branch", branch),
      ]);
      if (cErr || sErr) return json({ error: (cErr || sErr)!.message }, 500);
      return json({ cases: cases || [], surveys: surveys || [], notes: notes || [] });
    }

    if (action === "save_case") {
      const branch = await requireBranchSession(body.token);
      if (!branch) return json({ error: "الجلسة منتهية، سجّلي دخول تاني" }, 401);
      const KINDS = ["complaint", "suggestion", "compliment"];
      const CATS = ["care", "health", "safety", "communication", "fees", "staff", "protection", "facilities", "learning", "other"];
      const STATUSES = ["new", "review", "action", "resolved"];
      const SOURCES = ["portal", "phone", "whatsapp", "in_person", "other"];
      const now = new Date().toISOString();
      const txt = (v: unknown, n: number) => (v === undefined || v === null ? undefined : String(v).trim().slice(0, n));

      if (!body.id) {
        // logged by staff (phone / WhatsApp / in person)
        let regRow: any = null;
        if (body.registration_id) {
          const { data } = await admin.from("portal_registrations").select("id, parent_user_id, contact_email, form_data").eq("id", body.registration_id).eq("branch", branch).single();
          regRow = data;
        }
        const subject = txt(body.subject, 160);
        if (!subject) return json({ error: "اكتبي عنوان الملاحظة" }, 400);
        const category = CATS.includes(body.category) ? body.category : "other";
        const { data: row, error } = await admin.from("feedback_cases").insert({
          branch,
          registration_id: regRow?.id || null,
          parent_user_id: regRow?.parent_user_id || null,
          parent_name: txt(body.parent_name, 120) || regRow?.form_data?.fName || null,
          contact: txt(body.contact, 120) || regRow?.contact_email || null,
          child_name: txt(body.child_name, 120) || regRow?.form_data?.name || null,
          source: SOURCES.includes(body.source) ? body.source : "phone",
          kind: KINDS.includes(body.kind) ? body.kind : "complaint",
          category,
          subject,
          description: txt(body.description, 3000) || null,
          sensitive: !!body.sensitive || category === "staff" || category === "protection",
          status: "review",
          acknowledged_at: now,
          created_by: "staff",
        }).select("*").single();
        if (error) return json({ error: error.message }, 500);
        return json({ ok: true, case: row });
      }

      const { data: cur, error: curErr } = await admin.from("feedback_cases").select("*").eq("id", body.id).eq("branch", branch).single();
      if (curErr || !cur) return json({ error: "غير موجود" }, 404);
      const upd: Record<string, unknown> = { updated_at: now };
      if (CATS.includes(body.category)) { upd.category = body.category; if (body.category === "staff" || body.category === "protection") upd.sensitive = true; }
      if (KINDS.includes(body.kind)) upd.kind = body.kind;
      if (body.sensitive !== undefined) upd.sensitive = !!body.sensitive || upd.sensitive === true;
      if (body.action_taken !== undefined) upd.action_taken = txt(body.action_taken, 3000) || null;
      if (body.parent_satisfied !== undefined) upd.parent_satisfied = body.parent_satisfied === null ? null : !!body.parent_satisfied;
      if (STATUSES.includes(body.status)) {
        upd.status = body.status;
        if (body.status !== "new" && !cur.acknowledged_at) upd.acknowledged_at = now;
        if (body.status === "resolved") { if (!cur.resolved_at) upd.resolved_at = now; } else upd.resolved_at = null;
      }
      const { data: row, error } = await admin.from("feedback_cases").update(upd).eq("id", body.id).select("*").single();
      if (error) return json({ error: error.message }, 500);

      // tell the parent once, when the case becomes resolved
      let notified = false;
      if (upd.status === "resolved" && cur.status !== "resolved" && cur.contact && /^\S+@\S+\.\S+$/.test(cur.contact) && resendKey) {
        let en = false;
        if (cur.registration_id) {
          const { data: rr } = await admin.from("portal_registrations").select("form_data").eq("id", cur.registration_id).single();
          en = rr?.form_data?.consentLang === "en";
        }
        const esc2 = (v: unknown) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || c));
        const detail = row.sensitive ? "" : (row.action_taken || "");
        const html = en
          ? `<div dir="ltr" style="font-family:sans-serif;line-height:1.8;max-width:560px;"><h2>Your feedback has been resolved</h2><p>Reference: <b>${esc2(row.ref)}</b></p>${detail ? `<p style="background:#f0fdf4;border-radius:8px;padding:10px;white-space:pre-wrap;">${esc2(detail)}</p>` : ""}<p>Thank you for helping us improve. If you are not satisfied, please reply or contact the branch.</p><p style="color:#94a3b8;font-size:12px;">Child Care Nurseries Group</p></div>`
          : `<div dir="rtl" style="font-family:sans-serif;line-height:1.9;max-width:560px;"><h2>تم حل ملاحظتك</h2><p>الرقم المرجعي: <b>${esc2(row.ref)}</b></p>${detail ? `<p style="background:#f0fdf4;border-radius:8px;padding:10px;white-space:pre-wrap;">${esc2(detail)}</p>` : ""}<p>شكراً لمساعدتك لنا على التحسّن. لو لسه مش راضية عن النتيجة، تواصلي مع الفرع.</p><p style="color:#94a3b8;font-size:12px;">مجموعة رعاية الطفل للحضانات</p></div>`;
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from: "مجموعة رعاية الطفل للحضانات <login@childcareuae.com>", to: cur.contact, subject: en ? `Your feedback is resolved — ${row.ref}` : `تم حل ملاحظتك — ${row.ref}`, html }),
          });
          notified = res.ok;
        } catch (_e) { notified = false; }
      }
      return json({ ok: true, case: row, notified });
    }

    if (action === "save_note") {
      const branch = await requireBranchSession(body.token);
      if (!branch) return json({ error: "الجلسة منتهية، سجّلي دخول تاني" }, 401);
      const month = String(body.month || "");
      if (!/^\d{4}-\d{2}$/.test(month)) return json({ error: "شهر غير صحيح" }, 400);
      const { error } = await admin.from("partnership_notes").upsert(
        { branch, month, you_said_we_did: String(body.you_said_we_did || "").slice(0, 4000), updated_at: new Date().toISOString() },
        { onConflict: "branch,month" }
      );
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "list_evaluations") {
      const branch = await requireBranchSession(body.token);
      if (!branch) return json({ error: "الجلسة منتهية، سجّلي دخول تاني" }, 401);
      const { registration_id } = body;
      const { data, error } = await admin
        .from("monthly_evaluations")
        .select("*")
        .eq("registration_id", registration_id)
        .eq("branch", branch)
        .order("month", { ascending: false })
        .limit(24);
      if (error) return json({ error: error.message }, 500);
      return json({ evaluations: data || [] });
    }

    if (action === "admin_get_passwords") {
      if (!(await requireAdmin())) return json({ error: "غير مصرح لك" }, 403);
      const { data, error } = await admin
        .from("branch_admin_passwords")
        .select("branch, password, updated_at")
        .order("branch");
      if (error) return json({ error: error.message }, 500);
      return json({ passwords: data || [] });
    }

    if (action === "admin_set_password") {
      if (!(await requireAdmin())) return json({ error: "غير مصرح لك" }, 403);
      const { branch, password } = body;
      if (!branch || !password || String(password).length < 4) return json({ error: "بيانات ناقصة" }, 400);
      const { error } = await admin
        .from("branch_admin_passwords")
        .upsert({ branch, password, updated_at: new Date().toISOString() });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    return json({ error: "action غير معروف" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
