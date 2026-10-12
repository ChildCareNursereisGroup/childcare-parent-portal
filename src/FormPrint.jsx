// Printable registration form. It is built as a list of independent "blocks" so
// the PDF exporter can paginate without ever cutting a section in half
// (see lib/pdfExport.jsx). Pink theme for girls, blue for boys.

import { TERMS, CONSENTS, TERMS_VERSION } from "./terms";
import { toAr, withOther } from "./lists";

export const PAGE_W = 794;
export const PAGE_H = 1123;
export const PAD_X = 28;
export const SLIM_H = 46;
export const FOOT_H = 30;

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

function Logo({ size = 54 }) {
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
      <div style={{ background: th.grad, color: "#fff", padding: "8px 16px", fontWeight: 800, fontSize: 14.5 }}>{icon} {title}</div>
      <div style={{ padding: "12px 14px" }}>{children}</div>
    </div>
  );
}

// items: [label, value, { wide?, ltr? }]
function Grid({ th, items }) {
  const shown = items.filter((it) => has(it[1]));
  if (shown.length === 0) return <div style={{ fontSize: 12, color: "#94a3b8" }}>—</div>;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}>
      {shown.map(([label, value, o = {}], i) => (
        <div key={i} style={{ background: th.light, borderRadius: 10, padding: "6px 11px", gridColumn: o.wide ? "1 / -1" : undefined }}>
          <div style={{ fontSize: 10.5, color: th.dark, fontWeight: 700 }}>{label}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", wordBreak: "break-word", ...(o.ltr ? { direction: "ltr", textAlign: "right" } : {}) }}>{String(value)}</div>
        </div>
      ))}
    </div>
  );
}

const yn = (v) => (v === "yes" ? "نعم" : v === "no" ? "لا" : "");
const ynDetail = (v, d) => (v === "yes" ? `نعم — ${d || ""}` : yn(v));

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function buildFormBlocks({ f, branch, billing = {}, signatureDataUrl, attached = [] }) {
  const th = themeFor(f.gender);
  const girl = f.gender === "girl";
  const blocks = [];
  const add = (key, el) => blocks.push({ key, el });

  const branchAr = branch?.name?.ar || f.branch || "";

  // Header = the branch
  add("header", (
    <div style={{ background: th.grad, borderRadius: 22, padding: "22px 26px", color: "#fff", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -30, top: -30, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,.14)" }} />
      <div style={{ position: "absolute", left: 70, bottom: -50, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,.10)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
        <Logo />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, opacity: 0.92 }}>مجموعة رعاية الطفل للحضانات</div>
          <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.25 }}>{branchAr}</div>
          <div style={{ fontSize: 13, marginTop: 2 }}>استمارة تسجيل طفل {th.emoji} {girl ? "(بنت)" : "(ولد)"}</div>
        </div>
      </div>
    </div>
  ));

  add("child-banner", (
    <div style={{ background: th.soft, border: `1.5px solid ${th.border}`, borderRadius: 16, padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontSize: 11, color: th.dark, fontWeight: 700 }}>اسم الطفل</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>{th.emoji} {f.name}</div>
      </div>
      <div style={{ textAlign: "left", fontSize: 11.5, color: th.dark, lineHeight: 1.7 }}>
        <div>تاريخ الميلاد: <b dir="ltr">{f.dob}</b></div>
        <div>تاريخ التقديم: <b dir="ltr">{formatDateTime(f.consentedAt) || f.sigDate}</b></div>
      </div>
    </div>
  ));

  add("child", (
    <Card th={th} icon="🧒" title="بيانات الطفل">
      <Grid th={th} items={[
        ["اسم الطفل رباعياً", f.name, { wide: true }],
        ["اسم الشهرة", f.nick],
        ["النوع", toAr(f.gender)],
        ["تاريخ الميلاد", f.dob, { ltr: true }],
        ["الجنسية", withOther(f.nat, f.natOther)],
        ["الديانة", withOther(f.religion, f.religionOther)],
        ["اللغة الأولى", withOther(f.lang1, f.lang1Other)],
        ["لغات أخرى بالمنزل", f.langOther],
        ["عنوان السكن", f.address, { wide: true }],
      ]} />
    </Card>
  ));

  add("parents", (
    <Card th={th} icon="👨‍👩‍👧" title="الوالدان">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: th.dark, marginBottom: 6 }}>👨 الأب</div>
          <Grid th={th} items={[["الاسم", f.fName, { wide: true }], ["رقم الهوية / الجواز", f.fId, { wide: true, ltr: true }], ["رقم الجوال", f.fMobile, { wide: true, ltr: true }], ["البريد الإلكتروني", f.fEmail, { wide: true, ltr: true }], ["الوظيفة", f.fJob, { wide: true }]]} />
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: th.dark, marginBottom: 6 }}>👩 الأم</div>
          <Grid th={th} items={[["الاسم", f.mName, { wide: true }], ["رقم الهوية / الجواز", f.mId, { wide: true, ltr: true }], ["رقم الجوال", f.mMobile, { wide: true, ltr: true }], ["البريد الإلكتروني", f.mEmail, { wide: true, ltr: true }], ["الوظيفة", f.mJob, { wide: true }]]} />
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <Grid th={th} items={[["الحالة الاجتماعية للوالدين", toAr(f.marital), { wide: true }]]} />
      </div>
    </Card>
  ));

  const siblings = Array.isArray(f.siblings) ? f.siblings.filter((s) => s?.name) : [];
  const pickup = Array.isArray(f.pickupPersons) ? f.pickupPersons.filter((p) => p?.name) : [];
  add("safety", (
    <Card th={th} icon="🛡️" title="الطوارئ والاستلام">
      <div style={{ fontSize: 12.5, fontWeight: 800, color: th.dark, marginBottom: 6 }}>🚨 جهة اتصال الطوارئ</div>
      <Grid th={th} items={[["الاسم", f.emName], ["صلة القرابة", f.emRel], ["رقم الجوال", f.emMobile, { ltr: true }], ["هاتف المنزل / العمل", f.emHome, { ltr: true }]]} />
      <div style={{ fontSize: 12.5, fontWeight: 800, color: th.dark, margin: "12px 0 6px" }}>🤝 المصرّح لهم باستلام الطفل</div>
      {pickup.length === 0 ? (
        <div style={{ fontSize: 12, color: "#64748b" }}>الوالدان فقط.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {pickup.map((p, i) => (
            <div key={i} style={{ background: th.light, borderRadius: 10, padding: "6px 11px", fontSize: 12 }}>
              <b>{p.name}</b> — {p.relation}<br /><span dir="ltr">{p.phone}{p.idNumber ? ` · ${p.idNumber}` : ""}</span>
            </div>
          ))}
        </div>
      )}
      {siblings.length > 0 && (
        <>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: th.dark, margin: "12px 0 6px" }}>👫 الإخوة</div>
          <div style={{ fontSize: 12, lineHeight: 1.8 }}>{siblings.map((s, i) => (<div key={i}>• {s.name}{s.dob ? ` — ${s.dob}` : ""}{s.school ? ` — ${s.school}` : ""}</div>))}</div>
        </>
      )}
    </Card>
  ));

  add("health", (
    <Card th={th} icon="🩺" title="الحالة الصحية">
      <Grid th={th} items={[
        ["أمراض مزمنة؟", ynDetail(f.illness, f.illnessDetail), { wide: f.illness === "yes" }],
        ["أدوية منتظمة؟", ynDetail(f.meds, f.medsDetail), { wide: f.meds === "yes" }],
        ["حساسية أطعمة/أدوية؟", ynDetail(f.allergy, f.allergyDetail), { wide: f.allergy === "yes" }],
        ["احتياجات خاصة / متابعة علاجية؟", ynDetail(f.special, f.specialDetail), { wide: f.special === "yes" }],
        ["فصيلة الدم", toAr(f.blood)],
        ["التطعيمات مكتملة؟", yn(f.vax)],
        ["نظارة / سماعة؟", yn(f.glasses)],
        ["مشكلة سمع أو نظر؟", yn(f.hearing)],
        ["طبيب الطفل وهاتفه", f.doctor, { wide: true }],
      ]} />
    </Card>
  ));

  const skills = f.skills && typeof f.skills === "object" ? Object.entries(f.skills).filter(([, v]) => v).map(([k]) => toAr(k)) : [];
  add("about", (
    <Card th={th} icon="🌈" title="عن الطفل ومهاراته">
      <Grid th={th} items={[
        ["ترتيبه بين إخوته", toAr(f.order)],
        ["شخصية الطفل", toAr(f.personality)],
        ["الهوايات / الألعاب المفضلة", f.hobbies],
        ["الألوان المفضلة", f.colors],
        ["أكتر حاجة يحبها", f.loves],
        ["أكتر حاجة تخوّفه", f.fears],
        ["مهارات الطفل", skills.length ? skills.join("، ") : f.skillsNone ? "لا توجد مهارات من القائمة بعد" : "", { wide: true }],
        ["أطعمة لا يتناولها", f.foodNo],
        ["أطعمة مفضلة", f.foodLike],
        ["ينام بمفرده؟", yn(f.sleepAlone)],
        ["يستخدم لهاية/رضّاعة؟", yn(f.pacifier)],
        ["عدد ساعات النوم", f.sleepHrs],
      ]} />
    </Card>
  ));

  add("plan", (
    <Card th={th} icon="🗓️" title="الخطة والرسوم">
      <Grid th={th} items={[
        ["خطة الدوام", billing.planLabel, { wide: true }],
        ["طريقة الدفع", toAr(f.frequency)],
        ["المواصلات", billing.transportLabel],
        ["أيام نهاية الأسبوع المضافة", (billing.weekendLabels || []).join("، ")],
        ["الرسوم الدورية", has(billing.recurring_fee) ? `${billing.recurring_fee} د.إ` : ""],
        ["التسجيل + الطبي + القرطاسية + الزي", billing.one_time_fee ? `${billing.one_time_fee} د.إ` : "تحدّدها الإدارة"],
        ["كود الخصم / العرض", f.promoCode],
      ]} />
    </Card>
  ));

  add("docs", (
    <Card th={th} icon="📎" title="المستندات المرفقة">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {attached.length === 0 && <span style={{ fontSize: 12, color: "#64748b" }}>—</span>}
        {attached.map((a, i) => (
          <span key={i} style={{ background: th.soft, color: th.dark, border: `1px solid ${th.border}`, borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>✓ {a}</span>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 8 }}>الملفات مرفقة كمستندات منفصلة مع هذه الاستمارة.</div>
    </Card>
  ));

  TERMS.forEach((sec, si) => {
    add(`terms-${si}`, (
      <div style={{ border: `1.5px solid ${th.border}`, borderRadius: 16, overflow: "hidden", background: "#fff" }}>
        <div style={{ background: th.soft, color: th.dark, padding: "7px 16px", fontWeight: 800, fontSize: 13 }}>{si === 0 ? "📜 الشروط والأحكام — " : ""}{sec.title.ar}</div>
        <div style={{ padding: "8px 16px", fontSize: 10.5, lineHeight: 1.75, color: "#334155" }}>
          {sec.items.map((it, ii) => (<p key={ii} style={{ margin: "4px 0" }}>• {it.ar}</p>))}
        </div>
      </div>
    ));
  });

  const consEl = (
    <Card th={th} icon="✅" title="الإقرارات والموافقات">
      <div style={{ fontSize: 11.5, lineHeight: 1.85 }}>
        {CONSENTS.map((c) => (
          <div key={c.key} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 3 }}>
            <span style={{ color: f.consents?.[c.key] ? "#16a34a" : "#dc2626", fontWeight: 900 }}>{f.consents?.[c.key] ? "☑" : "☐"}</span><span>{c.ar}</span>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 4, fontWeight: 700 }}>
          <span style={{ color: f.media === "yes" ? "#16a34a" : "#dc2626", fontWeight: 900 }}>{f.media === "yes" ? "☑" : "☐"}</span>
          <span>{f.media === "yes" ? "أوافق على تصوير الطفل ونشر صوره في أنشطة الحضانة ومنصاتها." : "لا أوافق على تصوير الطفل ونشر صوره."}</span>
        </div>
      </div>
    </Card>
  );

  const sigEl = (
    <div style={{ border: `2.5px solid ${th.primary}`, borderRadius: 20, background: th.light, padding: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: th.dark, marginBottom: 10 }}>✍️ توقيع ولي الأمر</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.35fr", gap: 12, alignItems: "stretch" }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: "10px 12px", border: `1px solid ${th.border}` }}>
          <div style={{ fontSize: 10.5, color: th.dark, fontWeight: 700 }}>اسم ولي الأمر</div>
          <div style={{ fontSize: 15, fontWeight: 800, marginTop: 6, wordBreak: "break-word" }}>{f.sigName || "—"}</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 14, padding: "10px 12px", border: `1px solid ${th.border}` }}>
          <div style={{ fontSize: 10.5, color: th.dark, fontWeight: 700 }}>رقم الهوية الإماراتية</div>
          <div style={{ fontSize: 15, fontWeight: 800, marginTop: 6, direction: "ltr", textAlign: "right" }}>{f.sigId || "—"}</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 14, padding: "8px 12px", border: `1.5px dashed ${th.primary}`, minHeight: 112 }}>
          <div style={{ fontSize: 10.5, color: th.dark, fontWeight: 700 }}>التوقيع</div>
          {signatureDataUrl ? (
            <img src={signatureDataUrl} alt="signature" style={{ display: "block", maxWidth: "100%", maxHeight: 84, margin: "4px auto 0" }} />
          ) : (
            <div style={{ height: 84 }} />
          )}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#475569", marginTop: 10 }}>
        <span>التاريخ: <b dir="ltr">{f.sigDate}</b></span>
        <span>وُقّعت إلكترونياً: <b dir="ltr">{formatDateTime(f.consentedAt)}</b></span>
        <span>إصدار الشروط: <b dir="ltr">{f.termsVersion || TERMS_VERSION}</b></span>
      </div>
    </div>
  );

  const phone = phoneFmt(branch?.phone);
  const wa = phoneFmt(branch?.whatsapp);
  const branchEl = (
    <div style={{ background: th.grad, borderRadius: 20, color: "#fff", padding: "16px 22px" }}>
      <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 8 }}>📍 {branchAr} — بيانات الفرع</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px", fontSize: 11.5, lineHeight: 1.7 }}>
        {branch?.address?.ar && <div>📍 {branch.address.ar}</div>}
        {phone && <div>📞 <span dir="ltr">{phone}</span></div>}
        {wa && wa !== phone && <div>💬 واتساب: <span dir="ltr">{wa}</span></div>}
        <div>🌐 <span dir="ltr">childcareuae.com</span></div>
        {branch?.fb && <div dir="ltr" style={{ textAlign: "right" }}>Facebook: {branch.fb}</div>}
        {branch?.ig && <div dir="ltr" style={{ textAlign: "right" }}>Instagram: {branch.ig}</div>}
        <div dir="ltr" style={{ textAlign: "right" }}>TikTok: tiktok.com/@child.care.nurser</div>
      </div>
      {branch?.bank && (
        <div style={{ marginTop: 10, background: "rgba(255,255,255,.2)", borderRadius: 12, padding: "8px 14px", fontSize: 11, lineHeight: 1.7 }}>
          <b>🏦 بيانات التحويل البنكي:</b> {branch.bank.holder} · {branch.bank.bank}<br />
          <span dir="ltr">IBAN: {branch.bank.iban} · BIC/SWIFT: {branch.bank.bic}</span>
        </div>
      )}
    </div>
  );

  // Signature and branch details always stay together; the branch block sits at the page bottom.
  add("closing", (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <div style={{ paddingBottom: 12 }}>{consEl}</div>
      {sigEl}
      <div style={{ marginTop: "auto", paddingTop: 14 }}>{branchEl}</div>
    </div>
  ));

  return { blocks, theme: th };
}

export function PageShell({ theme: th, branchName, childName, pageNo, total, first, children }) {
  return (
    <div dir="rtl" style={{ width: PAGE_W, height: PAGE_H, background: "#fff", fontFamily: "Tajawal, Arial, sans-serif", color: "#0f172a", display: "flex", flexDirection: "column", overflow: "hidden", boxSizing: "border-box" }}>
      {!first && (
        <div style={{ height: SLIM_H, background: th.grad, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${PAD_X}px`, fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
          <span>{branchName}</span>
          <span>استمارة تسجيل — {childName}</span>
        </div>
      )}
      <div style={{ flex: 1, padding: `${first ? 22 : 16}px ${PAD_X}px 6px`, overflow: "hidden" }}>{children}</div>
      <div style={{ height: FOOT_H, display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${PAD_X}px`, fontSize: 10.5, color: "#94a3b8", borderTop: `1px solid ${th.border}`, flexShrink: 0 }}>
        <span dir="ltr">childcareuae.com</span>
        <span>صفحة {pageNo} من {total}</span>
      </div>
    </div>
  );
}
