// Called by the admin screen inside the app. Verifies the caller is the
// designated admin, creates (or reuses) the parent's auth account, marks the
// registration approved, and emails the parent to let them know.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminEmail = (Deno.env.get("ADMIN_EMAIL") || "").toLowerCase();
    const resendKey = Deno.env.get("RESEND_API_KEY");

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userErr,
    } = await authClient.auth.getUser(jwt);

    if (userErr || !user || (user.email || "").toLowerCase() !== adminEmail) {
      return new Response(JSON.stringify({ error: "غير مصرح لك بهذا الإجراء" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const { registration_id } = await req.json();
    if (!registration_id) {
      return new Response(JSON.stringify({ error: "registration_id مطلوب" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: reg, error: regErr } = await admin
      .from("portal_registrations")
      .select("*")
      .eq("id", registration_id)
      .single();
    if (regErr || !reg) {
      return new Response(JSON.stringify({ error: "الطلب غير موجود" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }
    if (!reg.contact_email) {
      return new Response(JSON.stringify({ error: "لا يوجد بريد إلكتروني مسجل لهذا الطلب" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    let parentUserId: string | null = reg.parent_user_id;
    if (!parentUserId) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: reg.contact_email,
        email_confirm: true,
      });
      if (created?.user) {
        parentUserId = created.user.id;
      } else if (createErr && !String(createErr.message).toLowerCase().includes("already been registered")) {
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        });
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
    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

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

    return new Response(JSON.stringify({ ok: true, email_sent: emailSent }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
});
