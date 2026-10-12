// Printable registration form (Arabic or English, in the language the parent used).
// Built as independent "blocks" so the PDF exporter can paginate without ever cutting
// a section in half (see lib/pdfExport.jsx). Pink theme for girls, blue for boys.

import { TERMS, CONSENTS, TERMS_VERSION } from "./terms";
import { toLang, withOtherL } from "./lists";

export const PAGE_W = 794;
export const PAGE_H = 1123;
export const PAD_X = 28;
export const SLIM_H = 50;
export const FOOT_H = 32;

const THEMES = {
  girl: { emoji: "👧", grad: "linear-gradient(135deg,#f9a8d4,#ec4899 55%,#be185d)", primary: "#ec4899", dark: "#9d174d", light: "#fdf2f8", soft: "#fce7f3", border: "#fbcfe8" },
  boy: { emoji: "👦", grad: "linear-gradient(135deg,#7dd3fc,#0ea5e9 55%,#1d4ed8)", primary: "#0ea5e9", dark: "#1e3a8a", light: "#eff6ff", soft: "#dbeafe", border: "#bfdbfe" },
};
export const themeFor = (gender) => THEMES[gender] || THEMES.boy;

const phoneFmt = (p) => {
  const d = String(p || "").replace(/\D/g, "");
  return !d ? "" : d.startsWith("971") ? `00${d}` : d;
};
const has = (v) => v !== undefined && v !== null && v !== "";

function Logo({ size = 58 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="48" fill="#fff" fillOpacity="0.25" />
      <circle cx="50" cy="50" r="38" fill="#fff" />
      <circle cx="38" cy="45" r="9" fill="#2EA8DE" />
      <circle cx="62" cy="45" r="9" fill="#FF6FA0" />
      <path d="M30 62 Q50 78 70 62" stroke="#FFA63A" strokeWidth="6" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="24" r="5" fill="#2FBF9B" />
    </svg>
  );
}

function Card({ th, icon, title, children }) {
  return (
    <div style={{ border: `1.5px solid ${th.border}`, borderRadius: 16, overflow: "hidden", background: "#fff" }}>
      <div style={{ background: th.grad, color: "#fff", padding: "9px 16px", fontWeight: 800, fontSize: 17 }}>{icon} {title}</div>
      <div style={{ padding: "12px 14px" }}>{children}</div>
    </div>
  );
}

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// `billing` labels and `attached` entries are { ar, en } pairs; `branch` is the BRANCHES entry.
export function buildFormBlocks({ f, branch, billing = {}, signatureDataUrl, attached = [], lang = "ar" }) {
  const en = lang === "en";
  const t = (ar, e) => (en ? e : ar);
  const L = (v) => toLang(v, lang);
  const th = themeFor(f.gender);
  const girl = f.gender === "girl";
  const pick = (o) => (o && typeof o === "object" ? (en ? o.en : o.ar) : o);
  const ltr = { direction: "ltr", textAlign: en ? "left" : "right" };
  const blocks = [];
  const add = (key, el) => blocks.push({ key, el });

  const yn = (v) => (v === "yes" ? t("نعم", "Yes") : v === "no" ? t("لا", "No") : "");
  const ynDetail = (v, d) => (v === "yes" ? `${t("نعم", "Yes")} — ${d || ""}` : yn(v));
  const branchName = pick(branch?.name) || f.branch || "";

  // items: [label, value, { wide?, ltr? }]
  const Grid = ({ items }) => {
    const shown = items.filter((it) => has(it[1]));
    if (shown.length === 0) return <div style={{ fontSize: 14, color: "#94a3b8" }}>—</div>;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px 12px" }}>
        {shown.map(([label, value, o = {}], i) => (
          <div key={i} style={{ background: th.light, borderRadius: 10, padding: "7px 12px", gridColumn: o.wide ? "1 / -1" : undefined }}>
            <div style={{ fontSize: 12.5, color: th.dark, fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: "#0f172a", wordBreak: "break-word", ...(o.ltr ? ltr : {}) }}>{String(value)}</div>
          </div>
        ))}
      </div>
    );
  };
  const Sub = ({ children, style }) => <div style={{ fontSize: 14.5, fontWeight: 800, color: th.dark, margin: "0 0 7px", ...style }}>{children}</div>;

  // Header = the branch
  add("header", (
    <div style={{ background: th.grad, borderRadius: 22, padding: "22px 26px", color: "#fff", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", [en ? "right" : "left"]: -30, top: -30, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,.14)" }} />
      <div style={{ position: "absolute", [en ? "right" : "left"]: 70, bottom: -50, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,.10)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
        <Logo />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14.5, opacity: 0.95 }}>{t("مجموعة رعاية الطفل للحضانات", "Child Care Nurseries Group")}</div>
          <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.25 }}>{branchName}</div>
          <div style={{ fontSize: 15, marginTop: 2 }}>{t("استمارة تسجيل طفل", "Child Registration Form")} {th.emoji} {girl ? t("(بنت)", "(Girl)") : t("(ولد)", "(Boy)")}</div>
        </div>
      </div>
    </div>
  ));

  add("child-banner", (
    <div style={{ background: th.soft, border: `1.5px solid ${th.border}`, borderRadius: 16, padding: "13px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontSize: 13, color: th.dark, fontWeight: 700 }}>{t("اسم الطفل", "Child's name")}</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a" }}>{th.emoji} {f.name}</div>
      </div>
      <div style={{ textAlign: en ? "right" : "left", fontSize: 13.5, color: th.dark, lineHeight: 1.75 }}>
        <div>{t("تاريخ الميلاد", "Date of birth")}: <b dir="ltr">{f.dob}</b></div>
        <div>{t("تاريخ التقديم", "Submitted")}: <b dir="ltr">{formatDateTime(f.consentedAt) || f.sigDate}</b></div>
      </div>
    </div>
  ));

  add("child", (
    <Card th={th} icon="🧒" title={t("بيانات الطفل", "Child details")}>
      <Grid items={[
        [t("اسم الطفل رباعياً", "Full name"), f.name, { wide: true }],
        [t("اسم الشهرة", "Nickname"), f.nick],
        [t("النوع", "Gender"), L(f.gender)],
        [t("تاريخ الميلاد", "Date of birth"), f.dob, { ltr: true }],
        [t("الجنسية", "Nationality"), withOtherL(f.nat, f.natOther, lang)],
        [t("الديانة", "Religion"), withOtherL(f.religion, f.religionOther, lang)],
        [t("اللغة الأولى", "First language"), withOtherL(f.lang1, f.lang1Other, lang)],
        [t("لغات أخرى بالمنزل", "Other languages at home"), f.langOther],
        [t("عنوان السكن", "Home address"), f.address, { wide: true }],
      ]} />
    </Card>
  ));

  add("parents", (
    <Card th={th} icon="👨‍👩‍👧" title={t("الوالدان", "Parents")}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Sub>👨 {t("الأب", "Father")}</Sub>
          <Grid items={[[t("الاسم", "Name"), f.fName, { wide: true }], [t("رقم الهوية / الجواز", "Emirates ID / Passport"), f.fId, { wide: true, ltr: true }], [t("رقم الجوال", "Mobile"), f.fMobile, { wide: true, ltr: true }], [t("البريد الإلكتروني", "Email"), f.fEmail, { wide: true, ltr: true }], [t("الوظيفة", "Occupation"), f.fJob, { wide: true }]]} />
        </div>
        <div>
          <Sub>👩 {t("الأم", "Mother")}</Sub>
          <Grid items={[[t("الاسم", "Name"), f.mName, { wide: true }], [t("رقم الهوية / الجواز", "Emirates ID / Passport"), f.mId, { wide: true, ltr: true }], [t("رقم الجوال", "Mobile"), f.mMobile, { wide: true, ltr: true }], [t("البريد الإلكتروني", "Email"), f.mEmail, { wide: true, ltr: true }], [t("الوظيفة", "Occupation"), f.mJob, { wide: true }]]} />
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <Grid items={[[t("الحالة الاجتماعية للوالدين", "Parents' marital status"), L(f.marital), { wide: true }]]} />
      </div>
    </Card>
  ));

  const siblings = Array.isArray(f.siblings) ? f.siblings.filter((s) => s?.name) : [];
  const pickup = Array.isArray(f.pickupPersons) ? f.pickupPersons.filter((p) => p?.name) : [];
  add("safety", (
    <Card th={th} icon="🛡️" title={t("الطوارئ والاستلام", "Emergency & pickup")}>
      <Sub>🚨 {t("جهة اتصال الطوارئ", "Emergency contact")}</Sub>
      <Grid items={[[t("الاسم", "Name"), f.emName], [t("صلة القرابة", "Relationship"), f.emRel], [t("رقم الجوال", "Mobile"), f.emMobile, { ltr: true }], [t("هاتف المنزل / العمل", "Home / work phone"), f.emHome, { ltr: true }]]} />
      <Sub style={{ marginTop: 12 }}>🤝 {t("المصرّح لهم باستلام الطفل", "Authorized pickup persons")}</Sub>
      {pickup.length === 0 ? (
        <div style={{ fontSize: 14, color: "#64748b" }}>{t("الوالدان فقط.", "Parents only.")}</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {pickup.map((p, i) => (
            <div key={i} style={{ background: th.light, borderRadius: 10, padding: "7px 12px", fontSize: 14.5 }}>
              <b>{p.name}</b> — {p.relation}<br /><span dir="ltr">{p.phone}{p.idNumber ? ` · ${p.idNumber}` : ""}</span>
            </div>
          ))}
        </div>
      )}
      {siblings.length > 0 && (
        <>
          <Sub style={{ marginTop: 12 }}>👫 {t("الإخوة", "Siblings")}</Sub>
          <div style={{ fontSize: 14.5, lineHeight: 1.8 }}>{siblings.map((s, i) => (<div key={i}>• {s.name}{s.dob ? ` — ${s.dob}` : ""}{s.school ? ` — ${s.school}` : ""}</div>))}</div>
        </>
      )}
    </Card>
  ));

  add("health", (
    <Card th={th} icon="🩺" title={t("الحالة الصحية", "Health")}>
      <Grid items={[
        [t("أمراض مزمنة؟", "Chronic illness?"), ynDetail(f.illness, f.illnessDetail), { wide: f.illness === "yes" }],
        [t("أدوية منتظمة؟", "Regular medication?"), ynDetail(f.meds, f.medsDetail), { wide: f.meds === "yes" }],
        [t("حساسية أطعمة/أدوية؟", "Food/medicine allergies?"), ynDetail(f.allergy, f.allergyDetail), { wide: f.allergy === "yes" }],
        [t("احتياجات خاصة / متابعة علاجية؟", "Special needs / ongoing therapy?"), ynDetail(f.special, f.specialDetail), { wide: f.special === "yes" }],
        [t("فصيلة الدم", "Blood type"), L(f.blood)],
        [t("التطعيمات مكتملة؟", "Vaccinations up to date?"), yn(f.vax)],
        [t("نظارة / سماعة؟", "Glasses / hearing aid?"), yn(f.glasses)],
        [t("مشكلة سمع أو نظر؟", "Hearing or vision problem?"), yn(f.hearing)],
        [t("طبيب الطفل وهاتفه", "Child's doctor & phone"), f.doctor, { wide: true }],
      ]} />
    </Card>
  ));

  const skills = f.skills && typeof f.skills === "object" ? Object.entries(f.skills).filter(([, v]) => v).map(([k]) => L(k)) : [];
  add("about", (
    <Card th={th} icon="🌈" title={t("عن الطفل ومهاراته", "About the child & skills")}>
      <Grid items={[
        [t("ترتيبه بين إخوته", "Birth order"), L(f.order)],
        [t("شخصية الطفل", "Personality"), L(f.personality)],
        [t("الهوايات / الألعاب المفضلة", "Favorite hobbies / toys"), f.hobbies],
        [t("الألوان المفضلة", "Favorite colors"), f.colors],
        [t("أكتر حاجة يحبها", "Loves most"), f.loves],
        [t("أكتر حاجة تخوّفه", "Fears most"), f.fears],
        [t("مهارات الطفل", "Child's skills"), skills.length ? skills.join(en ? ", " : "، ") : f.skillsNone ? t("لا توجد مهارات من القائمة بعد", "None of the listed skills yet") : "", { wide: true }],
        [t("أطعمة لا يتناولها", "Foods not allowed"), f.foodNo],
        [t("أطعمة مفضلة", "Favorite foods"), f.foodLike],
        [t("ينام بمفرده؟", "Sleeps alone?"), yn(f.sleepAlone)],
        [t("يستخدم لهاية/رضّاعة؟", "Uses pacifier/bottle?"), yn(f.pacifier)],
        [t("عدد ساعات النوم", "Sleep hours"), f.sleepHrs],
      ]} />
    </Card>
  ));

  add("plan", (
    <Card th={th} icon="🗓️" title={t("الخطة والرسوم", "Plan & fees")}>
      <Grid items={[
        [t("خطة الدوام", "Attendance plan"), pick(billing.planLabel), { wide: true }],
        [t("طريقة الدفع", "Payment frequency"), L(f.frequency)],
        [t("المواصلات", "Transportation"), pick(billing.transportLabel)],
        [t("أيام نهاية الأسبوع المضافة", "Added weekend days"), (billing.weekendLabels || []).map(pick).join(en ? ", " : "، ")],
        [t("الرسوم الدورية", "Recurring fee"), has(billing.recurring_fee) ? `${billing.recurring_fee} ${t("د.إ", "AED")}` : ""],
        [t("التسجيل + الطبي + القرطاسية + الزي", "Registration + medical + stationery + uniform"), billing.one_time_fee ? `${billing.one_time_fee} ${t("د.إ", "AED")}` : t("تحدّدها الإدارة", "Set by management")],
        [t("كود الخصم / العرض", "Discount code / offer"), f.promoCode],
      ]} />
    </Card>
  ));

  add("docs", (
    <Card th={th} icon="📎" title={t("المستندات المرفقة", "Attached documents")}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {attached.length === 0 && <span style={{ fontSize: 14, color: "#64748b" }}>—</span>}
        {attached.map((a, i) => (
          <span key={i} style={{ background: th.soft, color: th.dark, border: `1px solid ${th.border}`, borderRadius: 999, padding: "5px 14px", fontSize: 14, fontWeight: 700 }}>✓ {pick(a)}</span>
        ))}
      </div>
      <div style={{ fontSize: 13, color: "#64748b", marginTop: 8 }}>{t("الملفات مرفقة كمستندات منفصلة مع هذه الاستمارة.", "The files are attached as separate documents with this form.")}</div>
    </Card>
  ));

  TERMS.forEach((sec, si) => {
    add(`terms-${si}`, (
      <div style={{ border: `1.5px solid ${th.border}`, borderRadius: 16, overflow: "hidden", background: "#fff" }}>
        <div style={{ background: th.soft, color: th.dark, padding: "8px 16px", fontWeight: 800, fontSize: 15.5 }}>{si === 0 ? `📜 ${t("الشروط والأحكام", "Terms & conditions")} — ` : ""}{pick(sec.title)}</div>
        <div style={{ padding: "8px 16px", fontSize: 12.5, lineHeight: 1.8, color: "#334155" }}>
          {sec.items.map((it, ii) => (<p key={ii} style={{ margin: "4px 0" }}>• {pick(it)}</p>))}
        </div>
      </div>
    ));
  });

  const consEl = (
    <Card th={th} icon="✅" title={t("الإقرارات والموافقات", "Declarations & consents")}>
      <div style={{ fontSize: 13.5, lineHeight: 1.85 }}>
        {CONSENTS.map((c) => (
          <div key={c.key} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 4 }}>
            <span style={{ color: f.consents?.[c.key] ? "#16a34a" : "#dc2626", fontWeight: 900 }}>{f.consents?.[c.key] ? "☑" : "☐"}</span><span>{pick(c)}</span>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 4, fontWeight: 700 }}>
          <span style={{ color: f.media === "yes" ? "#16a34a" : "#dc2626", fontWeight: 900 }}>{f.media === "yes" ? "☑" : "☐"}</span>
          <span>{f.media === "yes" ? t("أوافق على تصوير الطفل ونشر صوره في أنشطة الحضانة ومنصاتها.", "I agree to photos/videos of my child being used in the nursery's activities and platforms.") : t("لا أوافق على تصوير الطفل ونشر صوره.", "I do not agree to photos/videos of my child being used.")}</span>
        </div>
      </div>
    </Card>
  );

  const sigEl = (
    <div style={{ border: `2.5px solid ${th.primary}`, borderRadius: 20, background: th.light, padding: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 900, color: th.dark, marginBottom: 10 }}>✍️ {t("توقيع ولي الأمر", "Parent's signature")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.35fr", gap: 12, alignItems: "stretch" }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: "10px 12px", border: `1px solid ${th.border}` }}>
          <div style={{ fontSize: 12.5, color: th.dark, fontWeight: 700 }}>{t("اسم ولي الأمر", "Parent's name")}</div>
          <div style={{ fontSize: 17, fontWeight: 800, marginTop: 6, wordBreak: "break-word" }}>{f.sigName || "—"}</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 14, padding: "10px 12px", border: `1px solid ${th.border}` }}>
          <div style={{ fontSize: 12.5, color: th.dark, fontWeight: 700 }}>{t("رقم الهوية الإماراتية", "Emirates ID number")}</div>
          <div style={{ fontSize: 17, fontWeight: 800, marginTop: 6, ...ltr }}>{f.sigId || "—"}</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 14, padding: "8px 12px", border: `1.5px dashed ${th.primary}`, minHeight: 112 }}>
          <div style={{ fontSize: 12.5, color: th.dark, fontWeight: 700 }}>{t("التوقيع", "Signature")}</div>
          {signatureDataUrl ? (
            <img src={signatureDataUrl} alt="signature" style={{ display: "block", maxWidth: "100%", maxHeight: 84, margin: "4px auto 0" }} />
          ) : (
            <div style={{ height: 84 }} />
          )}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "#475569", marginTop: 10, gap: 8 }}>
        <span>{t("التاريخ", "Date")}: <b dir="ltr">{f.sigDate}</b></span>
        <span>{t("وُقّعت إلكترونياً", "E-signed")}: <b dir="ltr">{formatDateTime(f.consentedAt)}</b></span>
        <span>{t("إصدار الشروط", "Terms version")}: <b dir="ltr">{f.termsVersion || TERMS_VERSION}</b></span>
      </div>
    </div>
  );

  const phone = phoneFmt(branch?.phone);
  const wa = phoneFmt(branch?.whatsapp);
  const branchEl = (
    <div style={{ background: th.grad, borderRadius: 20, color: "#fff", padding: "16px 22px" }}>
      <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>📍 {branchName} — {t("بيانات الفرع", "Branch details")}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px", fontSize: 13.5, lineHeight: 1.7 }}>
        {pick(branch?.address) && <div>📍 {pick(branch.address)}</div>}
        {phone && <div>📞 <span dir="ltr">{phone}</span></div>}
        {wa && wa !== phone && <div>💬 {t("واتساب", "WhatsApp")}: <span dir="ltr">{wa}</span></div>}
        <div>🌐 <span dir="ltr">childcareuae.com</span></div>
        {branch?.fb && <div dir="ltr" style={{ textAlign: en ? "left" : "right" }}>Facebook: {branch.fb}</div>}
        {branch?.ig && <div dir="ltr" style={{ textAlign: en ? "left" : "right" }}>Instagram: {branch.ig}</div>}
        <div dir="ltr" style={{ textAlign: en ? "left" : "right" }}>TikTok: tiktok.com/@child.care.nurser</div>
      </div>
      {branch?.bank && (
        <div style={{ marginTop: 10, background: "rgba(255,255,255,.2)", borderRadius: 12, padding: "8px 14px", fontSize: 13, lineHeight: 1.7 }}>
          <b>🏦 {t("بيانات التحويل البنكي", "Bank transfer details")}:</b> {branch.bank.holder} · {branch.bank.bank}<br />
          <span dir="ltr">IBAN: {branch.bank.iban} · BIC/SWIFT: {branch.bank.bic}</span>
        </div>
      )}
    </div>
  );

  // Declarations, signature and branch details stay together; the branch block sits at the page bottom.
  add("closing", (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ paddingBottom: 12 }}>{consEl}</div>
      {sigEl}
      <div style={{ marginTop: "auto", paddingTop: 14 }}>{branchEl}</div>
    </div>
  ));

  return { blocks, theme: th };
}

export function PageShell({ theme: th, lang = "ar", branchName, childName, pageNo, total, first, children }) {
  const en = lang === "en";
  return (
    <div dir={en ? "ltr" : "rtl"} style={{ width: PAGE_W, height: PAGE_H, background: "#fff", fontFamily: "Tajawal, Arial, sans-serif", color: "#0f172a", display: "flex", flexDirection: "column", overflow: "hidden", boxSizing: "border-box" }}>
      {!first && (
        <div style={{ height: SLIM_H, background: th.grad, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${PAD_X}px`, fontSize: 15, fontWeight: 800, flexShrink: 0 }}>
          <span>{branchName}</span>
          <span>{en ? "Registration form" : "استمارة تسجيل"} — {childName}</span>
        </div>
      )}
      <div style={{ flex: 1, padding: `${first ? 22 : 16}px ${PAD_X}px 6px`, overflow: "hidden" }}>{children}</div>
      <div style={{ height: FOOT_H, display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${PAD_X}px`, fontSize: 12.5, color: "#94a3b8", borderTop: `1px solid ${th.border}`, flexShrink: 0 }}>
        <span dir="ltr">childcareuae.com</span>
        <span>{en ? `Page ${pageNo} of ${total}` : `صفحة ${pageNo} من ${total}`}</span>
      </div>
    </div>
  );
}
