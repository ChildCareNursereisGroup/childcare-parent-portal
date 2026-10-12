// Parent-side feedback: quarterly survey + complaints/suggestions/compliments.
// The caller must be a logged-in parent with an approved registration; every
// write goes through the service role so the tables need no public policies.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });

const BRANCH_NAMES: Record<string, { ar: string; en: string }> = {
  farha: { ar: "الفرحة – القاسمية", en: "Al Farha – Al Qasimia" },
  saada: { ar: "السعادة – الشارقان", en: "Al Saada – Al Shargan" },
  dolphin: { ar: "دولفين – سمنان", en: "Dolphin – Samnan" },
  saadakids: { ar: "السعادة للأطفال", en: "Al Saada for Kids" },
  abtal: { ar: "أبطال البراعم", en: "Abtal Al Baraiem" },
};
const KINDS = ["complaint", "suggestion", "compliment"];
const CATEGORIES = ["care", "health", "safety", "communication", "fees", "staff", "protection", "facilities", "learning", "other"];
const SENSITIVE = new Set(["staff", "protection"]);
const KIND_AR: Record<string, string> = { complaint: "شكوى", suggestion: "اقتراح", compliment: "شكر" };
const KIND_EN: Record<string, string> = { complaint: "complaint", suggestion: "suggestion", compliment: "compliment" };

const esc = (v: unknown) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || c));

function currentQuarter(): string {
  // Gulf Standard Time (UTC+4)
  const d = new Date(Date.now() + 4 * 3600 * 1000);
  return `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
}

async function sendMail(resendKey: string | undefined, to: string, subject: string, html: string) {
  if (!resendKey || !to) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "مجموعة رعاية الطفل للحضانات <login@childcareuae.com>", to, subject, html }),
    });
    return res.ok;
  } catch (_e) {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const notifyEmail = Deno.env.get("NOTIFY_EMAIL") || "";
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: u, error: uErr } = await authClient.auth.getUser(jwt);
    if (uErr || !u.user) return json({ error: "غير مصرح" }, 401);

    const body = await req.json();
    const { action } = body;

    let q = admin
      .from("portal_registrations")
      .select("id, branch, contact_email, form_data, status")
      .eq("parent_user_id", u.user.id)
      .eq("status", "approved");
    if (body.registration_id) q = q.eq("id", body.registration_id);
    const { data: regs } = await q.limit(1);
    const reg = regs?.[0];
    if (!reg) return json({ error: "لا يوجد تسجيل مفعّل" }, 403);

    const childName = String(reg.form_data?.name || "").trim();
    const parentName = String(reg.form_data?.fName || reg.form_data?.mName || "").trim();

    if (action === "status") {
      const period = currentQuarter();
      const [{ data: done }, { data: cases }] = await Promise.all([
        admin.from("parent_surveys").select("id").eq("registration_id", reg.id).eq("period", period).limit(1),
        admin
          .from("feedback_cases")
          .select("id, ref, kind, category, subject, description, status, action_taken, received_at, resolved_at, sensitive")
          .eq("registration_id", reg.id)
          .order("received_at", { ascending: false })
          .limit(50),
      ]);
      return json({ period, survey_done: !!done?.length, registration_id: reg.id, cases: cases || [] });
    }

    if (action === "submit_survey") {
      const { answers, nps, positive, improve, anonymous, lang } = body;
      const clean: Record<string, number> = {};
      for (const [k, v] of Object.entries(answers || {})) {
        const n = Number(v);
        if (/^[a-z]\d{1,2}$/.test(k) && n >= 1 && n <= 5) clean[k] = n;
      }
      if (Object.keys(clean).length < 5) return json({ error: "من فضلك جاوب على 5 أسئلة على الأقل" }, 400);
      const npsN = nps === null || nps === undefined || nps === "" ? null : Math.max(0, Math.min(10, Number(nps)));
      const { error } = await admin.from("parent_surveys").upsert(
        {
          registration_id: reg.id,
          parent_user_id: u.user.id,
          branch: reg.branch,
          period: currentQuarter(),
          answers: clean,
          nps: Number.isFinite(npsN as number) ? npsN : null,
          positive: String(positive || "").slice(0, 1500) || null,
          improve: String(improve || "").slice(0, 1500) || null,
          anonymous: !!anonymous,
          lang: lang === "en" ? "en" : "ar",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "registration_id,period" }
      );
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    if (action === "submit_case") {
      const kind = KINDS.includes(body.kind) ? body.kind : "complaint";
      const category = CATEGORIES.includes(body.category) ? body.category : "other";
      const subject = String(body.subject || "").trim().slice(0, 160);
      const description = String(body.description || "").trim().slice(0, 3000);
      if (!subject || !description) return json({ error: "اكتب العنوان والتفاصيل" }, 400);
      const lang = body.lang === "en" ? "en" : "ar";

      const { data: c, error } = await admin
        .from("feedback_cases")
        .insert({
          registration_id: reg.id,
          parent_user_id: u.user.id,
          branch: reg.branch,
          parent_name: parentName || null,
          contact: reg.contact_email || null,
          child_name: childName || null,
          source: "portal",
          kind,
          category,
          subject,
          description,
          sensitive: SENSITIVE.has(category),
          created_by: "parent",
        })
        .select("id, ref")
        .single();
      if (error || !c) return json({ error: error?.message || "تعذّر الحفظ" }, 500);

      const bn = BRANCH_NAMES[reg.branch] || { ar: reg.branch, en: reg.branch };
      // management notification
      await sendMail(
        resendKey,
        notifyEmail,
        `ملاحظة جديدة من ولي أمر (${KIND_AR[kind]}) - ${bn.ar} - ${c.ref}`,
        `<div dir="rtl" style="font-family:sans-serif;line-height:1.9;max-width:600px;">
          <h2>${KIND_AR[kind]} جديدة — ${esc(c.ref)}</h2>
          <p><b>الفرع:</b> ${esc(bn.ar)}</p>
          <p><b>الطفل:</b> ${esc(childName)} — <b>ولي الأمر:</b> ${esc(parentName)} (${esc(reg.contact_email)})</p>
          <p><b>العنوان:</b> ${esc(subject)}</p>
          <p style="white-space:pre-wrap;background:#f8fafc;border-radius:8px;padding:10px;">${esc(description)}</p>
          <p style="color:#64748b;">المهلة المقترحة: الرد خلال 24 ساعة والحل خلال 5 أيام عمل — سجّلي الرد من شاشة إدارة الفرع.</p>
        </div>`
      );
      // receipt for the parent, in their language
      const html = lang === "en"
        ? `<div dir="ltr" style="font-family:sans-serif;line-height:1.8;max-width:560px;"><h2>We received your ${KIND_EN[kind]}</h2><p>Reference: <b>${esc(c.ref)}</b></p><p>Thank you for telling us. The branch management will reply within 24 hours and aim to resolve it within 5 working days. We'll email you when it's resolved.</p><p style="color:#94a3b8;font-size:12px;">Child Care Nurseries Group</p></div>`
        : `<div dir="rtl" style="font-family:sans-serif;line-height:1.9;max-width:560px;"><h2>استلمنا ${KIND_AR[kind]}ك</h2><p>الرقم المرجعي: <b>${esc(c.ref)}</b></p><p>شكراً لإبلاغنا. إدارة الفرع هترد خلال 24 ساعة وتحاول تحل الموضوع خلال 5 أيام عمل، وهنبعتلك إيميل لما يتحل.</p><p style="color:#94a3b8;font-size:12px;">مجموعة رعاية الطفل للحضانات</p></div>`;
      await sendMail(resendKey, reg.contact_email, lang === "en" ? `We received your ${KIND_EN[kind]} — ${c.ref}` : `استلمنا ${KIND_AR[kind]}ك — ${c.ref}`, html);
      return json({ ok: true, ref: c.ref });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
