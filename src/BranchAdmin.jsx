import { useState, useEffect } from "react";
import {
  ChevronLeft, LogOut, Search, CheckCircle2, X, UtensilsCrossed, Moon,
  Smile, FileText, Users,
} from "lucide-react";
import { supabase } from "./lib/supabaseClient";

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
  address: { ar: "العنوان", en: "Address" },
};

const SKIP_KEYS = new Set(["signatureDataUrl", "branch"]);

const MEAL_OPTIONS = { ar: ["أكل الكل", "أكل جزء", "رفض الأكل", "شرب مية كويس", "شرب مية قليل"], en: ["Ate all", "Ate some", "Refused food", "Drank water well", "Drank little water"] };
const SLEEP_OPTIONS = { ar: ["نام كويس", "نام شوية", "مانامش خالص"], en: ["Slept well", "Slept a little", "Didn't sleep at all"] };
const ACTIVITY_OPTIONS = { ar: ["مبسوط", "هادي", "متضايق", "نشيط", "لعب مع الأصدقاء", "رسم", "أنشطة حركية", "موسيقى"], en: ["Happy", "Calm", "Upset", "Energetic", "Played with friends", "Drawing", "Physical activity", "Music"] };

export const DOMAINS = [
  { id: "lang", ar: "اللغة والتواصل", en: "Language & Communication", sub: { ar: "نطق • مفردات • قصص", en: "Speech • vocabulary • stories" }, icon: "🗣️", placeholder: { ar: "ذكر 5 كلمات جديدة، يجيب بجمل قصيرة...", en: "Said 5 new words, answers in short sentences..." } },
  { id: "motor_g", ar: "المهارات الحركية الكبيرة", en: "Gross Motor Skills", sub: { ar: "توازن • مشي • قفز", en: "Balance • walking • jumping" }, icon: "🏃", placeholder: { ar: "يركض بدون سقوط، يصعد الدرج بثقة...", en: "Runs without falling, climbs stairs confidently..." } },
  { id: "motor_f", ar: "المهارات الحركية الدقيقة", en: "Fine Motor Skills", sub: { ar: "إمساك • رسم • قص", en: "Grip • drawing • cutting" }, icon: "✋", placeholder: { ar: "يمسك القلم صح، يقص بالمقص بإرشاد...", en: "Holds pencil correctly, cuts with guidance..." } },
  { id: "social", ar: "التطور الاجتماعي والعاطفي", en: "Social & Emotional", sub: { ar: "مشاركة • تعاون • مشاعر", en: "Sharing • cooperation • emotions" }, icon: "❤️", placeholder: { ar: "شارك الألعاب، عبّر عن مشاعره بكلمات...", en: "Shared toys, expressed feelings in words..." } },
  { id: "cognitive", ar: "التطور المعرفي", en: "Cognitive Development", sub: { ar: "تفكير • حل مشكلات • تصنيف", en: "Thinking • problem-solving • sorting" }, icon: "🧠", placeholder: { ar: "رتّب الأشكال حسب اللون، حل لغز بسيط...", en: "Sorted shapes by color, solved a simple puzzle..." } },
  { id: "selfcare", ar: "الاستقلالية والعناية الذاتية", en: "Independence & Self-care", sub: { ar: "نظافة • ترتيب • تناول طعام", en: "Hygiene • tidiness • eating" }, icon: "⭐", placeholder: { ar: "يغسل يديه وحده، يرتب أغراضه...", en: "Washes hands alone, tidies belongings..." } },
];

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

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} className="text-lg leading-none" style={{ color: n <= (value || 0) ? "#EF9F27" : "#e2e8f0" }}>
          ★
        </button>
      ))}
    </div>
  );
}

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function MonthlyEvalSection({ tr, lang, reg, token, showToast }) {
  const [month, setMonth] = useState(currentMonthKey());
  const [teacherName, setTeacherName] = useState("");
  const [ratings, setRatings] = useState({});
  const [observations, setObservations] = useState({});
  const [nextSteps, setNextSteps] = useState({});
  const [flags, setFlags] = useState([]);
  const [generalNote, setGeneralNote] = useState("");
  const [evaluations, setEvaluations] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = () => {
    supabase.functions.invoke("branch-admin", { body: { action: "list_evaluations", token, registration_id: reg.id } })
      .then(({ data }) => setEvaluations(data?.evaluations || []));
  };

  useEffect(() => { load(); }, [reg.id]);

  useEffect(() => {
    const existing = evaluations.find((e) => e.month === month);
    if (existing) {
      setTeacherName(existing.teacher_name || "");
      setRatings(existing.ratings || {});
      setObservations(existing.observations || {});
      setNextSteps(existing.next_steps || {});
      setFlags(existing.flags || []);
      setGeneralNote(existing.general_note || "");
    } else {
      setTeacherName("");
      setRatings({});
      setObservations({});
      setNextSteps({});
      setFlags([]);
      setGeneralNote("");
    }
  }, [month, evaluations]);

  const toggleFlag = (id) => {
    setFlags((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  };

  const activeFlagAlerts = EVAL_FLAGS[lang].filter((f) => flags.includes(f.id));

  const save = async () => {
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("branch-admin", {
      body: { action: "save_evaluation", token, registration_id: reg.id, month, teacher_name: teacherName, ratings, observations, next_steps: nextSteps, flags, general_note: generalNote },
    });
    setSaving(false);
    if (error || data?.error) { showToast(tr("حصل خطأ في حفظ التقييم", "Failed to save evaluation")); return; }
    showToast(tr("تم حفظ التقييم الشهري", "Monthly evaluation saved"));
    load();
  };

  return (
    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-slate-500">{tr("التقييم الشهري", "Monthly evaluation")}</p>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1" />
      </div>

      <input value={teacherName} onChange={(e) => setTeacherName(e.target.value)} placeholder={tr("اسم المعلمة", "Teacher's name")}
        className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs mb-3" />

      <div className="space-y-3">
        {DOMAINS.map((d) => (
          <div key={d.id} className="bg-white rounded-xl p-2.5 border border-slate-100">
            <div className="flex items-center gap-2 mb-1.5">
              <span>{d.icon}</span>
              <div>
                <div className="text-xs font-bold text-slate-700">{tr(d.ar, d.en)}</div>
                <div className="text-[10px] text-slate-400">{tr(d.sub.ar, d.sub.en)}</div>
              </div>
            </div>
            <StarRating value={ratings[d.id]} onChange={(v) => setRatings((r) => ({ ...r, [d.id]: v }))} />
            <textarea value={observations[d.id] || ""} onChange={(e) => setObservations((o) => ({ ...o, [d.id]: e.target.value }))}
              placeholder={tr(d.placeholder.ar, d.placeholder.en)} rows={2}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] mt-1.5" />
            <input value={nextSteps[d.id] || ""} onChange={(e) => setNextSteps((n) => ({ ...n, [d.id]: e.target.value }))}
              placeholder={tr("الخطوة التالية...", "Next step...")}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] mt-1.5" />
          </div>
        ))}
      </div>

      <p className="text-[11px] font-bold text-slate-500 mt-3 mb-1.5">{tr("علامات تستدعي انتباهاً خاصاً", "Flags needing special attention")}</p>
      <div className="flex flex-wrap gap-1.5">
        {EVAL_FLAGS[lang].map((f) => (
          <Chip key={f.id} label={f.label} active={flags.includes(f.id)} onClick={() => toggleFlag(f.id)} />
        ))}
      </div>
      {activeFlagAlerts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 mt-2 text-[11px] text-rose-600 leading-relaxed">
          {activeFlagAlerts.map((f) => (<p key={f.id}>{f.alert}</p>))}
        </div>
      )}

      <textarea value={generalNote} onChange={(e) => setGeneralNote(e.target.value)} placeholder={tr("ملاحظة عامة (اختياري)", "General note (optional)")} rows={2}
        className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs mt-3" />

      <button onClick={save} disabled={saving} className="w-full bg-sky-500 text-white font-bold py-2 rounded-xl text-xs mt-3 disabled:opacity-60">
        {saving ? tr("جارِ الحفظ...", "Saving...") : tr("حفظ التقييم الشهري", "Save monthly evaluation")}
      </button>

      {evaluations.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-200 space-y-1">
          <p className="text-[11px] font-bold text-slate-400">{tr("تقييمات سابقة", "Past evaluations")}</p>
          {evaluations.map((e) => (
            <div key={e.id} className="text-[11px] text-slate-500 flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {e.month}{e.flags?.length ? ` — ⚑ ${e.flags.length}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChildDetail({ tr, reg, classes, token, onClose, onChanged, showToast }) {
  const f = reg.form_data || {};
  const lang = tr("ar", "en") === "ar" ? "ar" : "en";
  const [approving, setApproving] = useState(false);
  const [settingStatus, setSettingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [classSel, setClassSel] = useState(reg.class_id || "");
  const [newClassName, setNewClassName] = useState("");
  const [savingClass, setSavingClass] = useState(false);
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [absent, setAbsent] = useState(false);
  const [mealsSel, setMealsSel] = useState([]);
  const [sleepSel, setSleepSel] = useState("");
  const [activitySel, setActivitySel] = useState([]);
  const [notes, setNotes] = useState("");
  const [savingReport, setSavingReport] = useState(false);
  const [reports, setReports] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    supabase.functions.invoke("branch-admin", { body: { action: "list_reports", token, registration_id: reg.id } })
      .then(({ data }) => setReports(data?.reports || []));
  }, [reg.id]);

  useEffect(() => {
    const existing = reports.find((r) => r.report_date === reportDate);
    if (existing) {
      setAbsent(!!existing.absent);
      setMealsSel(existing.meals ? existing.meals.split("، ").filter((x) => MEAL_OPTIONS.ar.includes(x) || MEAL_OPTIONS.en.includes(x)) : []);
      setSleepSel(existing.sleep || "");
      setActivitySel(existing.activity ? existing.activity.split("، ").filter((x) => ACTIVITY_OPTIONS.ar.includes(x) || ACTIVITY_OPTIONS.en.includes(x)) : []);
      setNotes(existing.notes || "");
    } else {
      setAbsent(false);
      setMealsSel([]);
      setSleepSel("");
      setActivitySel([]);
      setNotes("");
    }
  }, [reportDate, reports]);

  const toggleFrom = (arr, setArr, value) => {
    setArr(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const approve = async () => {
    setApproving(true);
    const { data, error } = await supabase.functions.invoke("branch-admin", { body: { action: "approve", token, registration_id: reg.id } });
    setApproving(false);
    if (error || data?.error) { showToast(tr("حصل خطأ أثناء الموافقة", "Approval failed")); return; }
    showToast(tr("تمت الموافقة", "Approved"));
    onChanged();
  };

  const setStatus = async (status) => {
    if (status === "stopped" && !window.confirm(tr("متأكدة إنك عايزة توقفي تسجيل الطفل ده؟ الأهل مش هيقدروا يشوفوا بياناته بعد كده.", "Are you sure you want to withdraw this child? Parents will lose access to their data."))) return;
    setSettingStatus(true);
    const { data, error } = await supabase.functions.invoke("branch-admin", { body: { action: "set_status", token, registration_id: reg.id, status } });
    setSettingStatus(false);
    if (error || data?.error) { showToast(tr("حصل خطأ", "Something went wrong")); return; }
    showToast(status === "stopped" ? tr("تم إيقاف تسجيل الطفل", "Child withdrawn") : tr("تم إعادة التفعيل", "Reactivated"));
    onChanged();
  };

  const deleteRegistration = async () => {
    const name = f.name || tr("الطفل ده", "this child");
    if (!window.confirm(tr(`متأكدة إنك عايزة تمسحي ملف ${name} نهائيًا؟ هيتمسح كل بياناته ومستنداته وتقاريره ومفيش رجعة في القرار ده.`, `Are you sure you want to permanently delete ${name}'s file? All their data, documents, and reports will be deleted — this cannot be undone.`))) return;
    if (!window.confirm(tr("تأكيد أخير: هل إنتِ متأكدة 100%؟", "Final check: are you 100% sure?"))) return;
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

  const saveReport = async () => {
    setSavingReport(true);
    const { data, error } = await supabase.functions.invoke("branch-admin", {
      body: {
        action: "save_report",
        token,
        registration_id: reg.id,
        report_date: reportDate,
        absent,
        meals: mealsSel.join("، "),
        sleep: sleepSel,
        activity: activitySel.join("، "),
        notes,
      },
    });
    setSavingReport(false);
    if (error || data?.error) { showToast(tr("حصل خطأ في حفظ التقرير", "Failed to save report")); return; }
    showToast(tr("تم حفظ التقرير", "Report saved"));
    supabase.functions.invoke("branch-admin", { body: { action: "list_reports", token, registration_id: reg.id } })
      .then(({ data }) => setReports(data?.reports || []));
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
          <button onClick={() => setStatus("stopped")} disabled={settingStatus} className="w-full bg-rose-50 text-rose-600 border border-rose-200 font-bold py-2.5 rounded-xl text-sm disabled:opacity-60">
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

        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-500">{tr("تقرير اليوم", "Daily report")}</p>
            <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1" />
          </div>

          <button onClick={() => setAbsent((v) => !v)}
            className={`w-full text-xs font-bold py-2 rounded-xl border mb-3 ${absent ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200"}`}>
            {absent ? tr("☑ غايب النهاردة — مفيش تقرير", "☑ Absent today — no report") : tr("☐ غايب النهاردة؟", "☐ Absent today?")}
          </button>

          {!absent && (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 flex items-center gap-1 mb-1.5"><UtensilsCrossed className="w-3 h-3" /> {tr("الأكل والشرب", "Food & drink")}</label>
                <div className="flex flex-wrap gap-1.5">
                  {MEAL_OPTIONS[lang].map((opt) => (
                    <Chip key={opt} label={opt} active={mealsSel.includes(opt)} onClick={() => toggleFrom(mealsSel, setMealsSel, opt)} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 flex items-center gap-1 mb-1.5"><Moon className="w-3 h-3" /> {tr("النوم", "Sleep")}</label>
                <div className="flex flex-wrap gap-1.5">
                  {SLEEP_OPTIONS[lang].map((opt) => (
                    <Chip key={opt} label={opt} active={sleepSel === opt} onClick={() => setSleepSel(sleepSel === opt ? "" : opt)} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 flex items-center gap-1 mb-1.5"><Smile className="w-3 h-3" /> {tr("النشاط والمزاج", "Activity & mood")}</label>
                <div className="flex flex-wrap gap-1.5">
                  {ACTIVITY_OPTIONS[lang].map((opt) => (
                    <Chip key={opt} label={opt} active={activitySel.includes(opt)} onClick={() => toggleFrom(activitySel, setActivitySel, opt)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-3">
            <label className="text-[11px] text-slate-400 mb-1 block">{tr("ملاحظة إضافية (اختياري)", "Extra note (optional)")}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={1} className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs" />
          </div>

          <button onClick={saveReport} disabled={savingReport} className="w-full bg-sky-500 text-white font-bold py-2 rounded-xl text-xs mt-3 disabled:opacity-60">
            {savingReport ? tr("جارِ الحفظ...", "Saving...") : tr("حفظ التقرير", "Save report")}
          </button>
          {reports.length > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-200 space-y-1">
              <p className="text-[11px] font-bold text-slate-400">{tr("آخر التقارير", "Recent reports")}</p>
              {reports.slice(0, 5).map((r) => (
                <div key={r.id} className="text-[11px] text-slate-500 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {r.report_date}{r.absent ? ` — ${tr("غياب", "Absent")}` : ""}
                </div>
              ))}
            </div>
          )}
        </div>

        <MonthlyEvalSection tr={tr} lang={lang} reg={reg} token={token} showToast={showToast} />

        <button onClick={deleteRegistration} disabled={deleting} className="w-full bg-white text-rose-500 border border-rose-200 font-bold py-2.5 rounded-xl text-xs disabled:opacity-60">
          {deleting ? tr("جارِ المسح...", "Deleting...") : tr("🗑 مسح ملف الطفل نهائيًا", "🗑 Permanently delete this child's file")}
        </button>
      </div>
    </div>
  );
}

export function BranchAdminScreen({ tr, session, onLogout, showToast }) {
  const [regs, setRegs] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

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
        {!loading && filtered.length === 0 && <p className="text-xs text-slate-400 text-center">{tr("لا يوجد أطفال مطابقين", "No matching children")}</p>}
        {filtered.map((r) => (
          <button key={r.id} onClick={() => setSelected(r.id)} className="w-full bg-white rounded-2xl p-3 shadow-sm border border-slate-100 text-right flex items-center justify-between">
            <ChevronLeft className="w-4 h-4 text-slate-300" />
            <div className="flex-1 text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <StatusChip status={r.status} tr={tr} />
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
