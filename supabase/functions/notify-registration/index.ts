// Triggered by a Database Webhook on INSERT into public.portal_registrations.
// Builds a full summary of the submitted form (including the signature and
// any uploaded documents) and emails it to the admin and to the parent.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FIELD_LABELS: Record<string, string> = {
  name: "اسم الطفل", nick: "اسم الشهرة", dob: "تاريخ الميلاد", gender: "النوع",
  nat: "الجنسية", religion: "الديانة", lang1: "اللغة الأولى", langOther: "لغات أخرى بالمنزل",
  address: "العنوان", transport: "المواصلات",
  fName: "اسم الأب", fNat: "جنسية الأب", fId: "هوية/جواز الأب", fJob: "وظيفة الأب",
  fCity: "مدينة الأب", fHome: "هاتف منزل الأب", fMobile: "جوال الأب", fEmail: "إيميل الأب", marital: "الحالة الاجتماعية",
  mName: "اسم الأم", mNat: "جنسية الأم", mId: "هوية/جواز الأم", mJob: "وظيفة الأم",
  mCity: "مدينة الأم", mHome: "هاتف منزل الأم", mMobile: "جوال الأم", mEmail: "إيميل الأم",
  emName: "اسم جهة الطوارئ", emRel: "صلة القرابة", emMobile: "جوال الطوارئ", emHome: "هاتف الطوارئ",
  illness: "مرض مزمن", illnessDetail: "تفاصيل المرض", meds: "أدوية منتظمة", medsDetail: "تفاصيل الأدوية",
  allergy: "حساسية", allergyDetail: "تفاصيل الحساسية", blood: "فصيلة الدم", vax: "التطعيمات مكتملة",
  glasses: "نظارة/سماعة", hearing: "مشكلة سمع/نظر", doctor: "طبيب الطفل",
  order: "ترتيبه بين إخوته", hobbies: "الهوايات", colors: "الألوان المفضلة", personality: "شخصية الطفل",
  loves: "أكثر شيء يحبه", fears: "أكثر شيء يخيفه",
  sleepHrs: "ساعات النوم", sleepAlone: "ينام بمفرده", foodLike: "أطعمة مفضلة", foodNo: "أطعمة ممنوعة",
  pacifier: "يستخدم لهاية/رضاعة", media: "موافقة الوسائط",
  sigName: "اسم الموقّع", sigId: "رقم هوية الموقّع", sigDate: "تاريخ التوقيع",
};

function esc(v: unknown): string {
  return String(v ?? "-").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] || c));
}

function renderFormSummary(formData: Record<string, unknown>): string {
  const rows = Object.entries(FIELD_LABELS)
    .filter(([key]) => formData[key] !== undefined && formData[key] !== "" && formData[key] !== null)
    .map(([key, label]) => `<tr><td style="padding:4px 8px;color:#64748b;">${esc(label)}</td><td style="padding:4px 8px;font-weight:bold;">${esc(formData[key])}</td></tr>`)
    .join("");

  const siblings = Array.isArray(formData.siblings)
    ? (formData.siblings as any[]).filter((s) => s?.name).map((s) => `${esc(s.name)} (${esc(s.dob)}) - ${esc(s.school)}`).join("<br/>")
    : "";
  const pickup = Array.isArray(formData.pickupPersons)
    ? (formData.pickupPersons as any[]).filter((p) => p?.name).map((p) => `${esc(p.name)} - ${esc(p.relation)} - ${esc(p.phone)}`).join("<br/>")
    : "";
  const skills = formData.skills && typeof formData.skills === "object"
    ? Object.entries(formData.skills as Record<string, boolean>).filter(([, v]) => v).map(([k]) => esc(k)).join("، ")
    : "";

  return `
    <table style="width:100%; border-collapse:collapse; font-size:13px;" dir="rtl">${rows}</table>
    ${siblings ? `<p><b>الإخوة:</b><br/>${siblings}</p>` : ""}
    ${pickup ? `<p><b>الأشخاص المصرح لهم بالاستلام:</b><br/>${pickup}</p>` : ""}
    ${skills ? `<p><b>مهارات الطفل:</b> ${skills}</p>` : ""}
  `;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function fetchAttachment(admin: ReturnType<typeof createClient>, path: string | null | undefined, filename: string) {
  if (!path) return null;
  const { data, error } = await admin.storage.from("registration-documents").download(path);
  if (error || !data) return null;
  const buf = await data.arrayBuffer();
  const base64 = bytesToBase64(new Uint8Array(buf));
  return { filename, content: base64 };
}

async function sendEmail(resendKey: string, to: string, subject: string, html: string, attachments: any[]) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "مجموعة رعاية الطفل للحضانات <login@childcareuae.com>", to, subject, html, attachments }),
  });
  return res.ok;
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;
    if (!record) return new Response("no record", { status: 400 });

    const resendKey = Deno.env.get("RESEND_API_KEY")!;
    const notifyEmail = Deno.env.get("NOTIFY_EMAIL")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const branch = record.branch || "-";
    const email = record.contact_email || "-";
    const billing = record.documents?.billing;
    const freqAr = billing ? ({ monthly: "شهري", weekly: "أسبوعي", daily: "يومي" } as Record<string, string>)[billing.frequency] || billing.frequency : "";
    const fee = billing ? `${billing.recurring_fee} د.إ (${freqAr}) + ${billing.one_time_fee} د.إ رسوم لمرة واحدة` : "-";

    const docs = record.documents || {};
    const attachments = (
      await Promise.all([
        fetchAttachment(admin, docs.signature, "توقيع-ولي-الأمر.png"),
        fetchAttachment(admin, docs.father_id, "هوية-الأب.jpg"),
        fetchAttachment(admin, docs.mother_id, "هوية-الأم.jpg"),
        fetchAttachment(admin, docs.child_id, "هوية-الطفل.jpg"),
        fetchAttachment(admin, docs.child_photo, "صورة-الطفل.jpg"),
        fetchAttachment(admin, docs.vaccination_card, "كارت-التطعيمات.jpg"),
      ])
    ).filter(Boolean);

    const signatureImg = docs.signature
      ? `<p><b>التوقيع:</b></p><img src="cid:signature" alt="signature" style="max-width:250px;border:1px solid #e2e8f0;border-radius:8px;" />`
      : "";

    const html = `
      <div dir="rtl" style="font-family: sans-serif; line-height: 1.9; max-width:600px;">
        <h2>نسخة من استمارة تسجيل طفل</h2>
        <p><b>الفرع:</b> ${esc(branch)}</p>
        <p><b>بريد ولي الأمر:</b> ${esc(email)}</p>
        <p><b>الرسوم:</b> ${esc(fee)}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;" />
        ${renderFormSummary(record.form_data || {})}
        <hr style="border:none;border-top:1px solid #e2e8f0;" />
        <p>المستندات المرفوعة والتوقيع مرفقين بهذا الإيميل.</p>
      </div>
    `;

    const adminSent = await sendEmail(resendKey, notifyEmail, `طلب تسجيل جديد - ${branch}`, html, attachments);

    let parentSent = false;
    if (record.contact_email) {
      parentSent = await sendEmail(resendKey, record.contact_email, "نسخة من استمارة تسجيل طفلك", html, attachments);
    }

    return new Response(JSON.stringify({ ok: true, admin_sent: adminSent, parent_sent: parentSent }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(String(e), { status: 500 });
  }
});
