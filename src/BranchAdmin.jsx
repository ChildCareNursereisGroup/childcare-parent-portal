import { useState, useEffect } from "react";
import {
  ChevronLeft, LogOut, Search, CheckCircle2, X,
  Smile, FileText, Users,
} from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { DOMAINS, AGE_BANDS, LEVELS, skillsFor, messageFor, bandForMonths, ageInMonths } from "./devBank";

export { DOMAINS };

const BRANCH_LABELS = {
  farha: { ar: "الفرحة – القاسمية", en: "Al Farha" },
  saada: { ar: "السعادة – الشارقان", en: "Al Saada" },
  dolphin: { ar: "دولفين – سمنان", en: "Dolphin" },
  saadakids: { ar: "السعادة للأطفال", en: "Al Saada for Kids" },
  abtal: { ar: "أبطال البراعم", en: "Abtal Al Baraiem" },
};

const DOC_LABELS = {
  full_form_pdf: { ar: "الاستمارة كاملة (PDF)", en: "Full form (PDF)" },
  father_id: { ar: "هوية الأب", en: "Father's ID" },
  mother_id: { ar: "هوية الأم", en: "Mother's ID" },
  child_id: { ar: "هوية/شهادة ميلاد الطفل", en: "Child's ID/birth cert." },
  child_photo: { ar: "صورة الطفل", en: "Child's photo" },
  vaccination_card: { ar: "كرت التطعيمات", en: "Vaccination card" },
  signature: { ar: "التوقيع", en: "Signature" },
};

const KEY_LABELS = {
  name: { ar: "اسم الطفل", en: "Child's name" },
  nick: { ar: "اسم الدلع", en: "Nickname" },
  dob: { ar: "تاريخ الميلاد", en: "Date of birth" },
  gender: { ar: "النوع", en: "Gender" },
  nat: { ar: "الجنسية", en: "Nationality" },
  blood: { ar: "فصيلة الدم", en: "Blood type" },
  fName: { ar: "اسم الأب", en: "Father's name" },
  fMobile: { ar: "موبايل الأب", en: "Father's mobile" },
  fEmail: { ar: "إيميل الأب", en: "Father's email" },
  mName: { ar: "اسم الأم", en: "Mother's name" },
  mMobile: { ar: "موبايل الأم", en: "Mother's mobile" },
  mEmail: { ar: "إيميل الأم", en: "Mother's email" },
  emName: { ar: "اسم جهة الطوارئ", en: "Emergency contact" },
  emRel: { ar: "صلة القرابة", en: "Relation" },
  emMobile: { ar: "موبايل الطوارئ", en: "Emergency mobile" },
  allergy: { ar: "حساسية؟", en: "Allergies?" },
  allergyDetail: { ar: "تفاصيل الحساسية", en: "Allergy details" },
  illness: { ar: "أمراض مزمنة؟", en: "Chronic illness?" },
  illnessDetail: { ar: "تفاصيل المرض", en: "Illness details" },
  meds: { ar: "أدوية؟", en: "Medication?" },
  medsDetail: { ar: "تفاصيل الأدوية", en: "Medication details" },
  doctor: { ar: "دكتور الطفل", en: "Child's doctor" },
  special: { ar: "احتياجات خاصة؟", en: "Special needs?" },
  specialDetail: { ar: "تفاصيل الاحتياجات", en: "Special needs details" },
  address: { ar: "العنوان", en: "Address" },
};

const SKIP_KEYS = new Set(["signatureDataUrl", "branch"]);

export const EVAL_FLAGS = {
  ar: [
    { id: "speech", label: "تأخر في الكلام", alert: "ممكن يحتاج تقييم نطق – راجعي مع مدير الفرع خلال أسبوع." },
    { id: "social_delay", label: "صعوبة اجتماعية", alert: "طبّقي أنشطة تفاعلية جماعية وراقبي التطور لمدة أسبوعين." },
    { id: "attention", label: "صعوبة تركيز", alert: "قصّري مدة الأنشطة لـ5-7 دقائق وضيفي فترات حركة." },
    { id: "behavior", label: "سلوك متكرر", alert: "وثّقي التوقيت والمحفز – أبلغي مدير الفرع للتقييم." },
    { id: "sensory", label: "حساسية حسية", alert: "جرّبي أدوات حسية آمنة وتحدثي مع الأهل عن بيئة البيت." },
    { id: "parent_meeting", label: "اجتماع أهل مطلوب", alert: "حددي موعد مع الأهل هذا الشهر وأعدّي ملف الطفل." },
    { id: "follow_up", label: "متابعة الشهر القادم", alert: "راجعي الملاحظة السابقة وقارني التقدم الشهر القادم." },
  ],
  en: [
    { id: "speech", label: "Speech delay", alert: "May need a speech assessment — review with branch manager within a week." },
    { id: "social_delay", label: "Social difficulty", alert: "Apply interactive group activities and monitor progress for two weeks." },
    { id: "attention", label: "Attention difficulty", alert: "Shorten activities to 5-7 minutes and add movement breaks." },
    { id: "behavior", label: "Repeated behavior", alert: "Document timing and trigger — inform branch manager for assessment." },
    { id: "sensory", label: "Sensory sensitivity", alert: "Try safe sensory tools and discuss the home environment with parents." },
    { id: "parent_meeting", label: "Parent meeting needed", alert: "Schedule a meeting with the parents this month and prepare the child's file." },
    { id: "follow_up", label: "Follow up next month", alert: "Review the previous note and compare progress next month." },
  ],
};

function humanizeKey(key) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function Chip({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`text-[11px] font-bold px-2.5 py-1.5 rounded-full border ${active ? "bg-sky-500 text-white border-sky-500" : "bg-white text-slate-500 border-slate-200"}`}>
      {label}
    </button>
  );
}

export function BranchLogin({ tr, onBack, onLoggedIn }) {
  const [branch, setBranch] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!branch) { setError(tr("اختاري الفرع", "Pick a branch")); return; }
    if (!password) { setError(tr("اكتبي الباسورد", "Enter the password")); return; }
    setLoading(true);
    const { data, error: fnError } = await supabase.functions.invoke("branch-admin", {
      body: { action: "login", branch, password },
    });
    setLoading(false);
    if (fnError || data?.error) {
      setError(data?.error || tr("حصل خطأ، جرّبي تاني", "Something went wrong"));
      return;
    }
    onLoggedIn({ token: data.token, branch: data.branch });
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 bg-gradient-to-b from-slate-700 to-slate-900 text-white relative">
      {onBack && (
        <button onClick={onBack} className="absolute top-4 right-4 bg-white/20 rounded-full w-8 h-8 flex items-center justify-center">
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      <h1 className="text-lg font-extrabold mb-1 text-center">{tr("دخول إدارة الفرع", "Branch admin login")}</h1>
      <p className="text-slate-300 text-xs mb-6">{tr("لموظفي الفروع فقط", "Branch staff only")}</p>
      <div className="w-full bg-white rounded-2xl p-5 shadow-xl text-slate-700">
        <p className="text-xs font-bold text-slate-500 mb-2">{tr("اختاري الفرع", "Pick your branch")}</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {Object.entries(BRANCH_LABELS).map(([key, label]) => (
            <button key={key} onClick={() => setBranch(key)}
              className={`text-xs font-bold py-2.5 rounded-xl border-2 transition ${branch === key ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200"}`}>
              {tr(label.ar, label.en)}
            </button>
          ))}
        </div>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="🔒 ••••" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mb-3 text-center focus:outline-none focus:ring-2 focus:ring-slate-400" />
        {error && <p className="text-xs text-rose-500 font-bold mb-3 text-center">{error}</p>}
        <button onClick={submit} disabled={loading} className="w-full bg-slate-800 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-60">
          {loading ? tr("جارِ الدخول...", "Logging in...") : tr("دخول", "Log in")}
        </button>
      </div>
    </div>
  );
}

function StatusChip({ status, tr }) {
  const map = {
    pending: { color: "bg-amber-100 text-amber-600", label: tr("قيد المراجعة", "Pending") },
    approved: { color: "bg-emerald-100 text-emerald-600", label: tr("مقبول", "Approved") },
    stopped: { color: "bg-rose-100 text-rose-600", label: tr("متوقف عن الحضانة", "Withdrawn") },
  };
  const s = map[status] || { color: "bg-amber-100 text-amber-600", label: status };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>
      {s.label}
    </span>
  );
}

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function endOfMonth(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m, 0);
}

function SkillEvalSection({ tr, lang, reg, token, showToast, onChanged }) {
  const f = reg.form_data || {};
  const [month, setMonth] = useState(currentMonthKey());
  const [band, setBand] = useState("C");
  const [teacherName, setTeacherName] = useState("");
  const [ratings, setRatings] = useState({});
  const [flags, setFlags] = useState([]);
  const [generalNote, setGeneralNote] = useState("");
  const [evaluations, setEvaluations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState({ lang: true });
  const [showAllMsgs, setShowAllMsgs] = useState({});

  const months = ageInMonths(f.dob, endOfMonth(month));
  const autoBand = months === null ? "C" : bandForMonths(months);
  const ageText = months === null ? "—" : months < 24 ? tr(`${months} شهر`, `${months} months`) : tr(`${Math.floor(months / 12)} سنة و${months % 12} شهر`, `${Math.floor(months / 12)}y ${months % 12}m`);

  const load = () => {
    supabase.functions.invoke("branch-admin", { body: { action: "list_evaluations", token, registration_id: reg.id } })
      .then(({ data }) => setEvaluations(data?.evaluations || []));
  };
  useEffect(() => { load(); }, [reg.id]);

  useEffect(() => {
    const existing = evaluations.find((e) => e.month === month);
    if (existing) {
      setBand(existing.age_band || autoBand);
      setTeacherName(existing.teacher_name || "");
      setRatings(existing.ratings || {});
      setFlags(existing.flags || []);
      setGeneralNote(existing.general_note || "");
    } else {
      setBand(autoBand);
      setTeacherName("");
      setRatings({});
      setFlags([]);
      setGeneralNote("");
    }
  }, [month, evaluations, autoBand]);

  const skills = skillsFor(band);
  const total = DOMAINS.reduce((n, d) => n + skills[d.id].length, 0);
  const done = DOMAINS.reduce((n, d) => n + skills[d.id].filter((s) => ratings[s.id]).length, 0);
  const alreadyDone = evaluations.some((e) => e.month === month);
  const msg = (skillId, level) => messageFor({ skillId, level, name: f.name, gender: f.gender, lang });
  const activeFlagAlerts = EVAL_FLAGS[lang].filter((x) => flags.includes(x.id));

  const save = async () => {
    if (done === 0) { showToast(tr("اختاري مستوى مهارة واحدة على الأقل", "Pick a level for at least one skill")); return; }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("branch-admin", {
      body: { action: "save_evaluation", token, registration_id: reg.id, month, age_band: band, teacher_name: teacherName, ratings, observations: {}, next_steps: {}, flags, general_note: generalNote },
    });
    setSaving(false);
    if (error || data?.error) { showToast(tr("حصل خطأ في حفظ التقييم", "Failed to save evaluation")); return; }
    showToast(tr("تم حفظ التقييم الشهري ✓", "Monthly evaluation saved ✓"));
    load();
    onChanged();
  };

  return (
    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
      <div className="flex items-center justify-between mb-1">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-800" />
        <p className="text-xs font-bold text-slate-600">{tr("📈 التقييم الشهري للنمو", "📈 Monthly development report")}</p>
      </div>
      <p className="text-[11px] text-slate-400 mb-2 text-right">{tr("يُسجَّل مرة واحدة كل شهر، في آخر الشهر.", "Recorded once a month, at the end of the month.")}</p>
      <div className={`text-[11px] font-bold rounded-xl px-2.5 py-1.5 mb-3 text-right ${alreadyDone ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-700"}`}>
        {alreadyDone ? tr(`✓ تقييم ${month} محفوظ (تقدري تعدّليه)`, `✓ ${month} evaluation saved (you can edit it)`) : tr(`⏳ تقييم ${month} لسه ما اتسجلش`, `⏳ ${month} evaluation not recorded yet`)}
      </div>

      <p className="text-[11px] text-slate-500 mb-1 text-right">{tr(`عمر الطفل في الشهر ده: ${ageText}`, `Child's age this month: ${ageText}`)}</p>
      <p className="text-[11px] font-bold text-slate-500 mb-1 text-right">{tr("مرحلة المهارات المراد تقييمها:", "Skills stage to assess:")}</p>
      <div className="flex flex-wrap gap-1.5 justify-end mb-1">
        {AGE_BANDS.map((b) => (
          <Chip key={b.id} label={`${tr(b.ar, b.en)}${b.id === autoBand ? " ★" : ""}`} active={band === b.id} onClick={() => setBand(b.id)} />
        ))}
      </div>
      <p className="text-[10px] text-slate-400 mb-3 text-right">{tr("★ = المرحلة المناسبة لعمره. تقدري تختاري مرحلة تانية لو الطفل أبطأ أو أسرع.", "★ = stage matching the child's age. Pick another stage if the child is ahead or behind.")}</p>

      <p className="text-[11px] font-bold text-slate-500 mb-2 text-right">{tr(`تم تقييم ${done} من ${total} مهارة`, `${done} of ${total} skills rated`)}</p>

      <div className="space-y-2">
        {DOMAINS.map((d) => {
          const isOpen = !!open[d.id];
          const n = skills[d.id].filter((s) => ratings[s.id]).length;
          return (
            <div key={d.id} className="bg-white rounded-xl border border-slate-100">
              <button type="button" onClick={() => setOpen((o) => ({ ...o, [d.id]: !o[d.id] }))} className="w-full flex items-center justify-between px-3 py-2.5">
                <span className="text-[11px] text-slate-400">{n}/{skills[d.id].length}</span>
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">{d.icon} {tr(d.ar, d.en)}</span>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 space-y-3">
                  {skills[d.id].map((s) => {
                    const lv = ratings[s.id];
                    return (
                      <div key={s.id} className="border-t border-slate-100 pt-2">
                        <p className="text-xs font-bold text-slate-700 text-right mb-1.5">{tr(s.ar, s.en)}</p>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {LEVELS.map((L) => {
                            const active = lv === L.v;
                            return (
                              <button key={L.v} type="button" onClick={() => setRatings((r) => ({ ...r, [s.id]: active ? undefined : L.v }))}
                                className="text-[10.5px] font-bold px-2 py-1 rounded-full border"
                                style={{ borderColor: L.color, background: active ? L.color : "#fff", color: active ? "#fff" : L.color }}>
                                {L.v} · {tr(L.ar, L.en)}
                              </button>
                            );
                          })}
                        </div>
                        {lv && <p className="text-[11px] leading-relaxed text-slate-600 bg-slate-50 rounded-lg p-2 mt-1.5 text-right">{msg(s.id, lv)}</p>}
                        <button type="button" onClick={() => setShowAllMsgs((m) => ({ ...m, [s.id]: !m[s.id] }))} className="text-[10.5px] text-sky-500 font-bold mt-1">
                          {showAllMsgs[s.id] ? tr("إخفاء الصيغ الجاهزة", "Hide ready messages") : tr("عرض الصيغ الخمس الجاهزة", "Show the 5 ready messages")}
                        </button>
                        {showAllMsgs[s.id] && (
                          <div className="space-y-1 mt-1">
                            {LEVELS.map((L) => (
                              <button key={L.v} type="button" onClick={() => setRatings((r) => ({ ...r, [s.id]: L.v }))}
                                className="w-full text-right text-[10.5px] leading-relaxed rounded-lg border p-2"
                                style={{ borderColor: L.color, background: lv === L.v ? `${L.color}22` : "#fff" }}>
                                <b style={{ color: L.color }}>{L.v} · {tr(L.ar, L.en)}</b><br />{msg(s.id, L.v)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] font-bold text-slate-500 mt-3 mb-1.5 text-right">{tr("علامات متابعة (للفريق فقط — مش بتظهر للأهل)", "Follow-up flags (staff only — not shown to parents)")}</p>
      <div className="flex flex-wrap gap-1.5 justify-end">
        {EVAL_FLAGS[lang].map((x) => (
          <Chip key={x.id} label={x.label} active={flags.includes(x.id)} onClick={() => setFlags((fl) => (fl.includes(x.id) ? fl.filter((y) => y !== x.id) : [...fl, x.id]))} />
        ))}
      </div>
      {activeFlagAlerts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 mt-2 text-[11px] text-rose-600 leading-relaxed text-right">
          {activeFlagAlerts.map((x) => (<p key={x.id}>{x.alert}</p>))}
        </div>
      )}

      <input value={teacherName} onChange={(e) => setTeacherName(e.target.value)} placeholder={tr("اسم المعلمة", "Teacher's name")}
        className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs mt-3 bg-white text-slate-800" />
      <textarea value={generalNote} onChange={(e) => setGeneralNote(e.target.value)} placeholder={tr("ملاحظة عامة للأهل (اختياري)", "General note to parents (optional)")} rows={2}
        className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs mt-2 bg-white text-slate-800" />

      <button onClick={save} disabled={saving} className="w-full bg-sky-500 text-white font-bold py-2.5 rounded-xl text-xs mt-3 disabled:opacity-60">
        {saving ? tr("جارِ الحفظ...", "Saving...") : tr("حفظ التقييم الشهري", "Save monthly evaluation")}
      </button>

      {evaluations.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-200 space-y-1">
          <p className="text-[11px] font-bold text-slate-400">{tr("تقييمات سابقة", "Past evaluations")}</p>
          {evaluations.map((e) => (
            <button key={e.id} type="button" onClick={() => setMonth(e.month)} className="text-[11px] text-slate-500 flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {e.month}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FeesSection({ tr, reg, token, showToast, onChanged }) {
  const billing = reg.documents?.billing || {};
  const fa = reg.fee_adjustments || {};
  const init = () => ({
    registration_fee: fa.registration_fee ?? "",
    medical_fee: fa.medical_fee ?? "",
    stationery_fee: fa.stationery_fee ?? "",
    uniform_fee: fa.uniform_fee ?? "",
    discount_amount: fa.discount_amount ?? "",
    discount_percent: fa.discount_percent ?? "",
    offer_note: fa.offer_note || "",
  });
  const [v, setV] = useState(init);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setV(init()); }, [reg.id, reg.fee_adjustments]);

  const n = (x) => (x === "" || x === null || x === undefined || isNaN(Number(x)) ? 0 : Number(x));
  const recurring = Number(billing.recurring_fee) || 0;
  const oneTime = n(v.registration_fee) + n(v.medical_fee) + n(v.stationery_fee) + n(v.uniform_fee);
  const pctOff = Math.round((recurring * n(v.discount_percent)) / 100);
  const total = Math.max(0, recurring - pctOff + oneTime - n(v.discount_amount));
  const promo = billing.promo_code || reg.form_data?.promoCode;
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("branch-admin", { body: { action: "save_fees", token, registration_id: reg.id, fees: v } });
    setSaving(false);
    if (error || data?.error) { showToast(tr("حصل خطأ في حفظ الرسوم", "Failed to save fees")); return; }
    showToast(tr("تم حفظ الرسوم والخصم", "Fees & discount saved"));
    onChanged();
  };

  const numInput = (k, label) => (
    <div>
      <label className="text-[11px] text-slate-400 block mb-1">{label}</label>
      <input type="number" min="0" inputMode="decimal" value={v[k]} onChange={set(k)} className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs bg-white text-slate-800" />
    </div>
  );

  return (
    <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100">
      <p className="text-xs font-bold text-amber-800 mb-2">{tr("💰 الرسوم والخصومات", "💰 Fees & discounts")}</p>
      {promo && (
        <p className="text-[11px] bg-white border border-amber-200 rounded-xl px-2.5 py-1.5 mb-2 text-amber-800">
          {tr("كود الخصم اللي كتبه ولي الأمر: ", "Parent's discount code: ")}<b dir="ltr">{promo}</b>
        </p>
      )}
      <p className="text-[11px] text-slate-500 mb-2">{tr(`الرسوم الدورية (من الاستمارة): ${recurring} د.إ`, `Recurring fee (from form): AED ${recurring}`)}</p>
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        {numInput("registration_fee", tr("التسجيل", "Registration"))}
        {numInput("medical_fee", tr("الطبي", "Medical"))}
        {numInput("stationery_fee", tr("القرطاسية", "Stationery"))}
        {numInput("uniform_fee", tr("الزي", "Uniform"))}
      </div>
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        {numInput("discount_amount", tr("خصم (درهم)", "Discount (AED)"))}
        {numInput("discount_percent", tr("خصم (% من الدورية)", "Discount (% of recurring)"))}
      </div>
      <input value={v.offer_note} onChange={set("offer_note")} placeholder={tr("اسم العرض / ملاحظة (مثال: خصم الإخوة)", "Offer name / note (e.g. sibling discount)")}
        className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs mb-2 bg-white text-slate-800" />
      <div className="flex items-center justify-between bg-white rounded-xl border border-amber-200 px-3 py-2 mb-2">
        <span className="text-sm font-extrabold text-slate-800">{total} {tr("د.إ", "AED")}</span>
        <span className="text-[11px] text-slate-500">{tr("الإجمالي المستحق (الدورية + التسجيل/الطبي/القرطاسية/الزي − الخصم)", "Total due (recurring + one-time − discount)")}</span>
      </div>
      <button onClick={save} disabled={saving} className="w-full bg-amber-500 text-white font-bold py-2 rounded-xl text-xs disabled:opacity-60">
        {saving ? tr("جارِ الحفظ...", "Saving...") : tr("حفظ الرسوم والخصم", "Save fees & discount")}
      </button>
    </div>
  );
}

function ChildDetail({ tr, reg, classes, token, onClose, onChanged, showToast }) {
  const f = reg.form_data || {};
  const lang = tr("ar", "en") === "ar" ? "ar" : "en";
  const [approving, setApproving] = useState(false);
  const [settingStatus, setSettingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [classSel, setClassSel] = useState(reg.class_id || "");
  const [newClassName, setNewClassName] = useState("");
  const [savingClass, setSavingClass] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const approve = async () => {
    setApproving(true);
    const { data, error } = await supabase.functions.invoke("branch-admin", { body: { action: "approve", token, registration_id: reg.id } });
    setApproving(false);
    if (error || data?.error) { showToast(tr("حصل خطأ أثناء الموافقة", "Approval failed")); return; }
    showToast(tr("تمت الموافقة", "Approved"));
    onChanged();
  };

  const setStatus = async (status) => {
    setSettingStatus(true);
    const { data, error } = await supabase.functions.invoke("branch-admin", { body: { action: "set_status", token, registration_id: reg.id, status } });
    setSettingStatus(false);
    if (error || data?.error) { showToast(tr("حصل خطأ", "Something went wrong")); return; }
    showToast(status === "stopped" ? tr("تم إيقاف تسجيل الطفل", "Child withdrawn") : tr("تم إعادة التفعيل", "Reactivated"));
    onChanged();
  };

  const deleteRegistration = async () => {
    setDeleting(true);
    const { data, error } = await supabase.functions.invoke("branch-admin", { body: { action: "delete_registration", token, registration_id: reg.id } });
    setDeleting(false);
    if (error || data?.error) { showToast(tr("حصل خطأ أثناء المسح", "Delete failed")); return; }
    showToast(tr("تم مسح ملف الطفل", "Child file deleted"));
    onClose();
    onChanged();
  };

  const saveClass = async () => {
    setSavingClass(true);
    const { data, error } = await supabase.functions.invoke("branch-admin", {
      body: { action: "assign_class", token, registration_id: reg.id, class_id: newClassName ? null : (classSel || null), new_class_name: newClassName || null },
    });
    setSavingClass(false);
    if (error || data?.error) { showToast(tr("حصل خطأ", "Something went wrong")); return; }
    setNewClassName("");
    showToast(tr("تم تحديث الفصل", "Class updated"));
    onChanged();
  };

  const knownEntries = Object.keys(KEY_LABELS).filter((k) => f[k] !== undefined && f[k] !== null && f[k] !== "");
  const otherEntries = Object.keys(f).filter((k) => !SKIP_KEYS.has(k) && !KEY_LABELS[k] && f[k] !== undefined && f[k] !== null && f[k] !== "" && typeof f[k] !== "object");

  return (
    <div className="absolute inset-0 bg-white z-20 flex flex-col">
      <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-slate-100">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100">
          <X className="w-4 h-4 text-slate-400" />
        </button>
        <p className="font-extrabold text-slate-800 text-sm">{f.name || tr("بدون اسم", "No name")}</p>
        <span className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <StatusChip status={reg.status} tr={tr} />
          <span className="text-xs text-slate-400" dir="ltr">{reg.contact_email}</span>
        </div>

        {reg.status === "pending" && (
          <button onClick={approve} disabled={approving} className="w-full bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-60">
            {approving ? tr("جارِ الموافقة...", "Approving...") : tr("✓ موافقة على التسجيل", "✓ Approve registration")}
          </button>
        )}

        {reg.status === "approved" && (
          <button onClick={() => setConfirming("stop")} disabled={settingStatus} className="w-full bg-rose-50 text-rose-600 border border-rose-200 font-bold py-2.5 rounded-xl text-sm disabled:opacity-60">
            {settingStatus ? tr("جارِ الحفظ...", "Saving...") : tr("⛔ إيقاف تسجيل الطفل (توقف عن الحضانة)", "⛔ Withdraw child from nursery")}
          </button>
        )}

        {reg.status === "stopped" && (
          <button onClick={() => setStatus("approved")} disabled={settingStatus} className="w-full bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-60">
            {settingStatus ? tr("جارِ الحفظ...", "Saving...") : tr("✅ إعادة تفعيل تسجيل الطفل", "✅ Reactivate child")}
          </button>
        )}

        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
          <p className="text-xs font-bold text-slate-500 mb-2">{tr("بيانات الطفل", "Child details")}</p>
          <div className="space-y-1.5">
            {knownEntries.map((k) => (
              <div key={k} className="flex justify-between gap-2 text-xs">
                <span className="text-slate-400">{tr(KEY_LABELS[k].ar, KEY_LABELS[k].en)}</span>
                <span className="text-slate-700 font-bold text-left" dir="auto">{String(f[k])}</span>
              </div>
            ))}
          </div>
          {otherEntries.length > 0 && (
            <>
              <button onClick={() => setShowAll((v) => !v)} className="text-[11px] text-sky-500 font-bold mt-2">
                {showAll ? tr("إخفاء باقي البيانات", "Hide extra data") : tr("عرض كل البيانات", "Show all data")}
              </button>
              {showAll && (
                <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-200">
                  {otherEntries.map((k) => (
                    <div key={k} className="flex justify-between gap-2 text-xs">
                      <span className="text-slate-400">{humanizeKey(k)}</span>
                      <span className="text-slate-700 font-bold text-left" dir="auto">{String(f[k])}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
          <p className="text-xs font-bold text-slate-500 mb-2">{tr("المستندات", "Documents")}</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(DOC_LABELS).map(([k, label]) => {
              const url = reg.document_urls?.[k];
              return (
                <a key={k} href={url || undefined} target="_blank" rel="noreferrer"
                  className={`text-[11px] font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1 ${url ? "bg-sky-100 text-sky-600" : "bg-slate-100 text-slate-300"}`}
                  onClick={(e) => !url && e.preventDefault()}>
                  <FileText className="w-3 h-3" /> {tr(label.ar, label.en)}
                </a>
              );
            })}
          </div>
        </div>

        <FeesSection tr={tr} reg={reg} token={token} showToast={showToast} onChanged={onChanged} />

        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
          <p className="text-xs font-bold text-slate-500 mb-2">{tr("الفصل", "Class")}</p>
          <div className="flex gap-2 mb-2">
            <select value={classSel} onChange={(e) => { setClassSel(e.target.value); setNewClassName(""); }}
              className="flex-1 border border-slate-200 rounded-xl px-2 py-2 text-xs">
              <option value="">{tr("— بدون فصل —", "— No class —")}</option>
              {classes.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <input value={newClassName} onChange={(e) => setNewClassName(e.target.value)}
            placeholder={tr("أو اكتبي اسم فصل جديد", "Or type a new class name")}
            className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs mb-2" />
          <button onClick={saveClass} disabled={savingClass} className="w-full bg-slate-800 text-white font-bold py-2 rounded-xl text-xs disabled:opacity-60">
            {savingClass ? tr("جارِ الحفظ...", "Saving...") : tr("حفظ الفصل", "Save class")}
          </button>
        </div>

        <SkillEvalSection tr={tr} lang={lang} reg={reg} token={token} showToast={showToast} onChanged={onChanged} />

        <button onClick={() => setConfirming("delete")} disabled={deleting} className="w-full bg-white text-rose-500 border border-rose-200 font-bold py-2.5 rounded-xl text-xs disabled:opacity-60">
          {deleting ? tr("جارِ المسح...", "Deleting...") : tr("🗑 مسح ملف الطفل نهائيًا", "🗑 Permanently delete this child's file")}
        </button>
      </div>

      {confirming && (
        <div className="absolute inset-0 z-30 bg-slate-900/60 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-5 w-full text-center space-y-3">
            <p className="text-sm font-extrabold text-slate-800">
              {confirming === "delete" ? tr("مسح ملف الطفل نهائياً؟", "Permanently delete this child's file?") : tr("إيقاف تسجيل الطفل؟", "Withdraw this child?")}
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              {confirming === "delete"
                ? tr("هيتمسح كل بياناته ومستنداته وتقييماته ومفيش رجعة في القرار ده.", "All data, documents and evaluations will be deleted. This cannot be undone.")
                : tr("الأهل مش هيقدروا يشوفوا بياناته بعد كده، وتقدري ترجّعيه في أي وقت.", "Parents will lose access to the data; you can reactivate later.")}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirming(null)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-xs">{tr("إلغاء", "Cancel")}</button>
              <button onClick={() => { const c = confirming; setConfirming(null); if (c === "delete") deleteRegistration(); else setStatus("stopped"); }}
                className="flex-1 bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs">
                {confirming === "delete" ? tr("أيوه، امسحي", "Yes, delete") : tr("أيوه، أوقفي", "Yes, withdraw")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function BranchAdminScreen({ tr, session, onLogout, showToast }) {
  const [regs, setRegs] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [onlyPending, setOnlyPending] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("branch-admin", { body: { action: "list", token: session.token } });
    setLoading(false);
    if (error || data?.error) {
      showToast(tr("الجلسة منتهية، سجّلي دخول تاني", "Session expired, log in again"));
      onLogout();
      return;
    }
    setRegs(data.registrations || []);
    setClasses(data.classes || []);
  };

  useEffect(() => { load(); }, []);

  const classNameById = Object.fromEntries(classes.map((c) => [c.id, c.name]));
  const q = search.trim().toLowerCase();
  const filtered = regs
    .filter((r) => {
      if (!q) return true;
      const name = (r.form_data?.name || "").toLowerCase();
      const cls = (classNameById[r.class_id] || "").toLowerCase();
      return name.includes(q) || cls.includes(q);
    })
    .sort((a, b) => (a.form_data?.name || "").localeCompare(b.form_data?.name || "", "ar"));

  const nowMonth = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; })();
  const lateInMonth = new Date().getDate() >= 20;
  const needsEval = (r) => r.status === "approved" && !(r.eval_months || []).includes(nowMonth);
  const shown = onlyPending ? filtered.filter(needsEval) : filtered;
  const pendingCount = regs.filter(needsEval).length;

  const selectedReg = selected ? regs.find((r) => r.id === selected) : null;

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex items-center justify-between px-4 pt-5 pb-3 bg-white border-b border-slate-100">
        <button onClick={onLogout} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100">
          <LogOut className="w-4 h-4 text-slate-400" />
        </button>
        <p className="font-extrabold text-slate-800 text-sm flex items-center gap-1">
          <Users className="w-4 h-4 text-slate-400" />
          {tr(BRANCH_LABELS[session.branch]?.ar, BRANCH_LABELS[session.branch]?.en) || session.branch}
        </p>
        <span className="w-8" />
      </div>

      <div className="px-4 pt-3 pb-2 bg-white border-b border-slate-100">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-300 absolute top-1/2 -translate-y-1/2 right-3" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={tr("دوري باسم الطفل أو اسم الفصل...", "Search by child or class name...")}
            className="w-full border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && <p className="text-xs text-slate-400 text-center">{tr("جارِ التحميل...", "Loading...")}</p>}
        {pendingCount > 0 && (
          <button type="button" onClick={() => setOnlyPending((v) => !v)}
            className={`w-full text-[11px] font-bold rounded-xl px-3 py-2 text-right ${onlyPending ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
            {onlyPending ? tr("عرض كل الأطفال", "Show all children") : tr(`⏳ ${pendingCount} طفل لسه ما اتعملش تقييمهم الشهري لشهر ${nowMonth}`, `⏳ ${pendingCount} children still need their ${nowMonth} monthly evaluation`)}
          </button>
        )}
        {!loading && filtered.length === 0 && <p className="text-xs text-slate-400 text-center">{tr("لا يوجد أطفال مطابقين", "No matching children")}</p>}
        {shown.map((r) => (
          <button key={r.id} onClick={() => setSelected(r.id)} className="w-full bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-right flex items-center justify-between">
            <ChevronLeft className="w-4 h-4 text-slate-300" />
            <div className="flex-1 text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <StatusChip status={r.status} tr={tr} />
                {needsEval(r) && lateInMonth && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{tr("⏳ التقييم الشهري", "⏳ Monthly eval")}</span>}
                {r.class_id && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{classNameById[r.class_id]}</span>}
              </div>
              <p className="text-sm font-bold text-slate-800">{r.form_data?.name || tr("بدون اسم", "No name")}</p>
            </div>
          </button>
        ))}
      </div>

      {selectedReg && (
        <ChildDetail
          tr={tr}
          reg={selectedReg}
          classes={classes}
          token={session.token}
          onClose={() => setSelected(null)}
          onChanged={() => { load(); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}
