// Triggered by a Database Webhook on INSERT into public.portal_registrations.
// Emails the nursery admin so a new registration doesn't go unnoticed.

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;
    if (!record) return new Response("no record", { status: 400 });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const notifyEmail = Deno.env.get("NOTIFY_EMAIL");

    const branch = record.branch || "-";
    const email = record.contact_email || "-";
    const billing = record.documents?.billing;
    const fee = billing ? `${billing.recurring_fee} د.إ (${billing.frequency === "monthly" ? "شهري" : billing.frequency === "weekly" ? "أسبوعي" : "يومي"})` : "-";

    const html = `
      <div dir="rtl" style="font-family: sans-serif; line-height: 1.8;">
        <h2>طلب تسجيل جديد</h2>
        <p><b>الفرع:</b> ${branch}</p>
        <p><b>بريد ولي الأمر:</b> ${email}</p>
        <p><b>الرسوم المتوقعة:</b> ${fee}</p>
        <p>افتحي شاشة الإدارة داخل بوابة أولياء الأمور لمراجعة الطلب والموافقة عليه.</p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Parent Portal <onboarding@resend.dev>",
        to: notifyEmail,
        subject: "طلب تسجيل جديد - بوابة أولياء الأمور",
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("resend error", errText);
      return new Response(errText, { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(String(e), { status: 500 });
  }
});
