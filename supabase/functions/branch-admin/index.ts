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

const DOC_KEYS = ["father_id", "mother_id", "child_id", "child_photo", "vaccination_card", "signature"];

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
        .select("id, status, form_data, documents, contact_email, class_id, created_at")
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

      return json({ branch, registrations: withUrls, classes: classes || [] });
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
