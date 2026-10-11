import { useState, useEffect, useRef, createContext, useContext } from "react";
import {
  Home, CalendarDays, ClipboardList, Wallet, MoreHorizontal, ChevronLeft,
  Bell, LogOut, Upload, FileText, MessageCircle, CheckCircle2, Circle,
  Droplet, Moon, Smile, UtensilsCrossed, Plus, X, AlertCircle,
  Sparkles, Check, Globe, MapPin, Phone, Facebook, Instagram, ChevronRight,
  Building2, Music2
} from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { BranchLogin, BranchAdminScreen, DOMAINS } from "./BranchAdmin";
import { generateFormPdfBlob } from "./lib/pdfExport";
import { TERMS, CONSENTS, TERMS_VERSION } from "./terms";

// ---------------- i18n ----------------
const LangCtx = createContext({ lang: "ar", tr: (a) => a });
const useLang = () => useContext(LangCtx);

// ---------------- data ----------------
const GROUP_WHATSAPP_CHANNEL = "whatsapp.com/channel/0029Vaa6ncZAYlUR5xH3YV2v";
const GROUP_TIKTOK = "tiktok.com/@child.care.nurser";

const BRANCHES = [
  {
    key: "farha",
    name: { ar: "الفرحة – القاسمية", en: "Al Farha – Al Qasimia" },
    phone: "+971 56 707 6419",
    whatsapp: "+971 56 707 6419",
    address: { ar: "القاسمية، المحطة، الشارقة", en: "Al Qasimia, Al Mahatta, Sharjah" },
    fb: "facebook.com/SharjahNursery",
    ig: "instagram.com/al_farha_nursery",
    bank: { holder: "AL FARHA NURSERY LLC SOLE PROPRIETORSHIP", iban: "AE640860000009210784074", bic: "WIOBAEADXXX", bank: "Wio Bank" },
  },
  {
    key: "saada",
    name: { ar: "السعادة – الشارقان", en: "Al Saada – Al Shargan" },
    phone: "+971 50 474 2500", whatsapp: "+971 50 474 2500",
    address: { ar: "منطقة الشارقان، الشارقة", en: "Sharqan Area, Sharjah" },
    fb: "facebook.com/BestNurseryUAE", ig: "instagram.com/al_saada_nursery",
    bank: { holder: "AL SAADA NURSERY LLC - SOLE PROPRIETORSHIP", iban: "AE900860000009361897772", bic: "WIOBAEADXXX", bank: "Wio Bank" },
  },
  {
    key: "dolphin",
    name: { ar: "دولفين – سمنان", en: "Dolphin – Samnan" },
    phone: "+971 50 114 4919", whatsapp: "+971 50 114 4919",
    address: { ar: "منطقة سمنان، الشارقة", en: "Samnan Area, Sharjah" },
    fb: "facebook.com/search/top?q=dolphin nursery", ig: "instagram.com/dolphin_nursery",
    bank: { holder: "Dolphin Nursery", iban: "AE53003001130435820001", bic: "ADCBAEAAXXX", bank: "Abu Dhabi Commercial Bank" },
  },
  {
    key: "saadakids",
    name: { ar: "السعادة للأطفال", en: "Al Saada for Kids" },
    phone: "+971 54 373 1196", whatsapp: "+971 54 373 1196",
    address: { ar: "عجمان", en: "Ajman" },
    fb: "facebook.com/AjmanbestNursery", ig: "instagram.com/alsaadaforkidsacademic",
    bank: { holder: "AL SAADA FOR KIDS LLC S.P.", iban: "AE900030012459108920001", bic: "ADCBAEAAXXX", bank: "Abu Dhabi Commercial Bank (Ajman, Br. 321)" },
  },
  {
    key: "abtal",
    name: { ar: "أبطال البراعم", en: "Abtal Al Baraiem" },
    phone: "", whatsapp: "",
    address: { ar: "المجاز، الشارقة", en: "Al Majaz, Sharjah" },
    fb: "facebook.com/profile.php?id=61578275925707", ig: "instagram.com/abtal_al_baraiem",
    bank: { holder: "ABTAL AL BARAIEM ENTERTAINMENT GAMES CENTER L.L.C.SP", iban: "AE780860000009055207559", bic: "WIOBAEADXXX", bank: "Wio Bank" },
  },
];

// New Academic Year 2026/2027 pricing (same across all branches).
// Regular attendance is Monday-Thursday. Payment frequency (monthly/weekly/
// daily) changes the rate. Weekend days (Fri/Sat/Sun) are an ADD-ON on top
// of the regular plan, not an alternative to it — no daily rate exists for
// weekend days, only monthly/weekly.
// One-time items whose amounts the branch manager enters per child (not fixed in the form).
const ONE_TIME_ITEMS = [
  { key: "registration", ar: "رسوم التسجيل", en: "Registration" },
  { key: "medical", ar: "رسوم الفحص الطبي", en: "Medical" },
  { key: "uniform", ar: "رسوم الزي", en: "Uniform" },
];
const FREQUENCIES = [
  { key: "monthly", label: { ar: "شهري", en: "Monthly" } },
  { key: "weekly", label: { ar: "أسبوعي", en: "Weekly" } },
  { key: "daily", label: { ar: "يومي", en: "Daily" } },
];
const PLAN_TIMES = [
  { key: "8", label: { ar: "٨:٠٠ ص", en: "8:00 AM" } },
  { key: "11", label: { ar: "١١:٠٠ ص", en: "11:00 AM" } },
  { key: "13", label: { ar: "١:٠٠ م", en: "1:00 PM" } },
  { key: "14", label: { ar: "٢:٠٠ م", en: "2:00 PM" } },
  { key: "15", label: { ar: "٣:٠٠ م", en: "3:00 PM" } },
  { key: "16", label: { ar: "٤:٠٠ م", en: "4:00 PM" } },
  { key: "17", label: { ar: "٥:٠٠ م", en: "5:00 PM" } },
];
const PLANS = [
  { key: "slot_8_11", from: "8", to: "11", label: { ar: "الاثنين - الخميس · ٨:٠٠ ص - ١١:٠٠ ص", en: "Mon-Thu · 8:00-11:00" }, monthly: 800, weekly: 250, daily: 60 },
  { key: "slot_11_15", from: "11", to: "15", label: { ar: "الاثنين - الخميس · ١١:٠٠ ص - ٣:٠٠ م", en: "Mon-Thu · 11:00-3:00" }, monthly: 1000, weekly: 350, daily: 80 },
  { key: "slot_8_13", from: "8", to: "13", label: { ar: "الاثنين - الخميس · ٨:٠٠ ص - ١:٠٠ م (+ساعة إضافية ١٠٠ د.إ)", en: "Mon-Thu · 8:00-1:00 (+AED100/extra hour)" }, monthly: 1100, weekly: 360, daily: 100 },
  { key: "slot_13_17", from: "13", to: "17", label: { ar: "الاثنين - الخميس · ١:٠٠ م - ٥:٠٠ م", en: "Mon-Thu · 1:00-5:00" }, monthly: 800, weekly: 250, daily: 80 },
  { key: "slot_8_14", from: "8", to: "14", label: { ar: "الاثنين - الخميس · ٨:٠٠ ص - ٢:٠٠ م", en: "Mon-Thu · 8:00-2:00" }, monthly: 1200, weekly: 400, daily: 100 },
  { key: "slot_8_15", from: "8", to: "15", label: { ar: "الاثنين - الخميس · ٨:٠٠ ص - ٣:٠٠ م", en: "Mon-Thu · 8:00-3:00" }, monthly: 1300, weekly: 420, daily: 110 },
  { key: "slot_8_16", from: "8", to: "16", label: { ar: "الاثنين - الخميس · ٨:٠٠ ص - ٤:٠٠ م", en: "Mon-Thu · 8:00-4:00" }, monthly: 1400, weekly: 450, daily: 120 },
  { key: "slot_8_17", from: "8", to: "17", label: { ar: "الاثنين - الخميس · ٨:٠٠ ص - ٥:٠٠ م", en: "Mon-Thu · 8:00-5:00" }, monthly: 1500, weekly: 500, daily: 150 },
];
const TRANSPORT_OPTIONS = [
  { key: "none", label: { ar: "بدون مواصلات", en: "No transportation" }, monthly: 0, weekly: 0, daily: 0 },
  { key: "one_way", label: { ar: "مواصلات اتجاه واحد", en: "Transportation, one way" }, monthly: 200, weekly: 60, daily: 20 },
  { key: "two_way", label: { ar: "مواصلات اتجاهين", en: "Transportation, two ways" }, monthly: 300, weekly: 100, daily: 30 },
];
const WEEKEND_DAYS = [
  { key: "friday", label: { ar: "الجمعة", en: "Friday" }, monthly: 150, weekly: 50 },
  { key: "saturday", label: { ar: "السبت", en: "Saturday" }, monthly: 150, weekly: 50 },
  { key: "sunday", label: { ar: "الأحد", en: "Sunday" }, monthly: 150, weekly: 50 },
];

const NATIONALITIES = ["Emirati|إماراتي", "Egyptian|مصري", "Indian|هندي", "Pakistani|باكستاني", "Filipino|فلبيني", "Syrian|سوري", "Jordanian|أردني", "British|بريطاني", "Other|غير ذلك"];
const RELIGIONS = ["Muslim|مسلم", "Christian|مسيحي", "Hindu|هندوسي", "Other|غير ذلك"];
const LANGUAGES = ["Arabic|العربية", "English|الإنجليزية", "Urdu/Hindi|الأردية/الهندية", "Other|غير ذلك"];
const CITIES = ["Sharjah|الشارقة", "Ajman|عجمان", "Dubai|دبي", "Other|غير ذلك"];
const BLOOD = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown|لا يُعرف"];
const PERSONALITY = ["Calm|هادئ", "Social|اجتماعي", "Shy|خجول", "Very active|كثير الحركة", "A leader|قيادي"];
const SKILLS = [
  "Feeds themself independently|الاعتماد على نفسه في تناول الطعام",
  "Uses the toilet independently|استخدام الحمام بمفرده",
  "Washes hands independently|غسل اليدين بمفرده",
  "Dresses & puts on shoes|ارتداء الحذاء والملابس",
  "Holds a pencil correctly|الإمساك بالقلم بشكل صحيح",
  "Colors within the lines|التلوين داخل الحدود",
  "Recognizes colors|التعرف على الألوان",
  "Recognizes some letters & numbers|التعرف على بعض الحروف والأرقام",
  "Counts to 10|العد حتى ١٠",
  "Speaks in clear sentences|التحدث بجمل واضحة",
];
const QUICK_NOTES = [
  "Was active and engaged all day|كان نشيطًا ومتفاعلًا طوال اليوم",
  "Ate meals well today|تناول وجباته بشكل جيد اليوم",
  "Enjoyed playtime with friends|استمتع بوقت اللعب مع أصدقائه",
  "Was calm and needed time to settle|كان هادئًا واحتاج وقتًا للتأقلم",
  "Participated enthusiastically in art activities|شارك بحماس في الأنشطة الفنية",
  "Needs encouragement to try new foods|يحتاج تشجيعًا على تجربة أطعمة جديدة",
];
const COMPLAINT_TOPICS = ["Fees|الرسوم", "Transportation|المواصلات", "Health|الصحة", "Activities|الأنشطة", "Other|غير ذلك"];
const WEEK = ["Monday|الاثنين", "Tuesday|الثلاثاء", "Wednesday|الأربعاء", "Thursday|الخميس"];

function split(s) { const [en, ar] = s.split("|"); return { en, ar: ar || en }; }

// ---------------- small ui ----------------
function Toast({ text }) {
  if (!text) return null;
  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50 whitespace-nowrap max-w-[85%] text-center">
      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
      {text}
    </div>
  );
}
function TopBar({ title, onBack }) {
  const { lang } = useLang();
  return (
    <div className="flex items-center gap-2 px-4 pt-5 pb-3 bg-white border-b border-slate-100">
      {onBack && (
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100">
          <ChevronLeft className={`w-5 h-5 text-slate-500 ${lang === "en" ? "rotate-180" : ""}`} />
        </button>
      )}
      <h1 className="text-base font-bold text-slate-800 flex-1" style={{ textAlign: lang === "ar" ? "right" : "left" }}>{title}</h1>
    </div>
  );
}
function StatusChip({ ok, label }) {
  return (
    <span className={`text-[11px] px-2 py-1 rounded-full font-bold flex items-center gap-1 ${ok ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
      {label}
    </span>
  );
}
function Field({ label, type = "text", value, onChange, req, inputMode, autoComplete, ltr }) {
  const { lang } = useLang();
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 block mb-1" style={{ textAlign: lang === "ar" ? "right" : "left" }}>{label}{req && <span className="text-rose-500"> *</span>}</label>
      <input type={type} inputMode={inputMode} autoComplete={autoComplete} value={value || ""} onChange={onChange}
        dir={ltr ? "ltr" : undefined}
        style={{ textAlign: ltr ? "left" : lang === "ar" ? "right" : "left" }}
        className="w-full border border-slate-200 bg-white rounded-2xl px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300" />
    </div>
  );
}
function TextArea({ label, value, onChange, rows = 3 }) {
  const { lang } = useLang();
  return (
    <div>
      {label && <label className="text-xs font-bold text-slate-500 block mb-1" style={{ textAlign: lang === "ar" ? "right" : "left" }}>{label}</label>}
      <textarea value={value || ""} onChange={onChange} rows={rows}
        style={{ textAlign: lang === "ar" ? "right" : "left" }}
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
    </div>
  );
}
function Select({ label, options, value, onChange, other, onOtherChange, req }) {
  const { lang, tr } = useLang();
  return (
    <div>
      {label && <label className="text-xs font-bold text-slate-500 block mb-1" style={{ textAlign: lang === "ar" ? "right" : "left" }}>{label}{req && <span className="text-rose-500"> *</span>}</label>}
      <div className="flex flex-wrap gap-1.5 justify-end" dir={lang === "ar" ? "rtl" : "ltr"}>
        {options.map((o) => {
          const { en, ar } = split(o);
          const val = en;
          const active = value === val;
          return (
            <button key={val} type="button" onClick={() => onChange(val)}
              className={`text-xs px-3.5 py-2 rounded-full border font-bold transition ${active ? "bg-gradient-to-l from-sky-500 to-cyan-400 text-white border-transparent shadow-sm" : "bg-white text-slate-500 border-slate-200"}`}>
              {tr(ar, en)}
            </button>
          );
        })}
      </div>
      {value === "Other" && (
        <input value={other || ""} onChange={onOtherChange} placeholder={tr("حددي...", "Please specify...")}
          style={{ textAlign: lang === "ar" ? "right" : "left" }}
          className="w-full mt-2 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-sm" />
      )}
    </div>
  );
}
function YesNo({ label, value, onChange }) {
  const { tr } = useLang();
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-1.5">
        {["yes", "no"].map((v) => (
          <button key={v} type="button" onClick={() => onChange(v)}
            className={`text-xs px-4 py-2 rounded-full border font-bold ${value === v ? "bg-gradient-to-l from-sky-500 to-cyan-400 text-white border-transparent" : "bg-white text-slate-500 border-slate-200"}`}>
            {v === "yes" ? tr("نعم", "Yes") : tr("لا", "No")}
          </button>
        ))}
      </div>
      <span className="text-xs font-bold text-slate-600">{label}</span>
    </div>
  );
}
function CheckRow({ label, checked, onChange }) {
  return (
    <button type="button" onClick={onChange} className="w-full flex items-center justify-between py-1.5">
      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${checked ? "bg-sky-500 border-sky-500" : "border-slate-300"}`}>
        {checked && <Check className="w-3 h-3 text-white" />}
      </span>
      <span className="text-xs font-bold text-slate-600">{label}</span>
    </button>
  );
}
function FileUploadRow({ label, status, fileName, error, onSelect }) {
  const { tr } = useLang();
  return (
    <div className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3 gap-2">
      <label className={`text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1 shrink-0 cursor-pointer ${status === "done" ? "bg-emerald-50 text-emerald-500" : status === "uploading" ? "bg-slate-100 text-slate-400" : "bg-sky-500 text-white"}`}>
        <input type="file" accept="image/*,.pdf" className="hidden"
          onChange={(e) => { const file = e.target.files?.[0]; if (file) onSelect(file); e.target.value = ""; }}
          disabled={status === "uploading"} />
        {status === "done" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
        {status === "uploading" ? tr("جارِ الرفع...", "Uploading...") : status === "done" ? tr("تم الرفع", "Uploaded") : tr("رفع", "Upload")}
      </label>
      <div className="text-right flex-1 min-w-0">
        <span className="text-sm text-slate-700 font-bold block">{label}</span>
        {fileName && status !== "error" && <span className="text-[10px] text-slate-400 block truncate">{fileName}</span>}
        {error && <span className="text-[10px] text-rose-500 block">{tr("فشل الرفع، حاولي تاني", "Upload failed, try again")}</span>}
      </div>
    </div>
  );
}
function SignaturePad({ onChange, hasSignature }) {
  const { tr } = useLang();
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const start = (e) => {
    drawingRef.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const move = (e) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const end = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    onChange(canvasRef.current.toDataURL("image/png"));
  };
  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
  };

  return (
    <div>
      <label className="text-xs font-bold text-slate-500 block mb-1" style={{ textAlign: "right" }}>{tr("توقيع ولي الأمر", "Parent's signature")}</label>
      <canvas
        ref={canvasRef}
        width={300}
        height={120}
        className="w-full bg-white border border-slate-200 rounded-xl"
        style={{ height: 120, touchAction: "none" }}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <div className="flex items-center justify-between mt-1">
        <button type="button" onClick={clear} className="text-[11px] text-rose-500 font-bold">{tr("مسح", "Clear")}</button>
        <span className="text-[11px] text-slate-400">{hasSignature ? tr("تم التوقيع ✓", "Signed ✓") : tr("وقّعي هنا بإصبعك أو الماوس", "Sign here with your finger or mouse")}</span>
      </div>
    </div>
  );
}
function StepDots({ step, total }) {
  return (
    <div className="flex items-center justify-center gap-1 py-2">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-sky-500" : "w-1.5 bg-slate-200"}`} />
      ))}
    </div>
  );
}

// ---------------- Landing (front page) ----------------
function Logo({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="48" fill="white" fillOpacity="0.15" />
      <circle cx="50" cy="50" r="38" fill="white" />
      <circle cx="38" cy="45" r="9" fill="#2EA8DE" />
      <circle cx="62" cy="45" r="9" fill="#FF6FA0" />
      <path d="M30 62 Q50 78 70 62" stroke="#FFA63A" strokeWidth="6" strokeLinecap="round" fill="none" />
      <circle cx="50" cy="24" r="5" fill="#2FBF9B" />
    </svg>
  );
}
function Landing({ onNew, onExisting, onBranchAdmin }) {
  const { lang, setLang, tr } = useLang();
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-sky-500 via-cyan-400 to-emerald-300 text-white relative">
      <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="absolute top-4 left-4 bg-white/20 rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1 z-10">
        <Globe className="w-3.5 h-3.5" /> {lang === "ar" ? "English" : "العربية"}
      </button>

      <div className="relative px-6 pt-10 pb-6 text-center overflow-hidden">
        <span className="absolute w-4 h-4 rounded-full bg-white/25" style={{ top: 10, right: 30 }} />
        <span className="absolute w-2.5 h-2.5 rounded-full bg-white/25" style={{ top: 40, right: 70 }} />
        <span className="absolute text-white/40" style={{ top: 16, left: 40, fontSize: 18 }}>★</span>
        <span className="absolute text-white/30" style={{ top: 60, left: 20, fontSize: 12 }}>★</span>

        <div className="flex justify-center mb-3"><Logo /></div>
        <h1 className="text-lg font-extrabold">{tr("مجموعة رعاية الطفل للحضانات", "Child Care Nurseries Group")}</h1>
        <p className="text-sky-50 text-xs mt-1">{tr("بوابة أولياء الأمور", "Parent Portal")}</p>
      </div>

      <div className="bg-white rounded-t-[2rem] px-5 pt-5 pb-6 text-slate-700 min-h-[420px]">
        <p className="text-xs leading-relaxed text-center text-slate-500 mb-4">
          {tr(
            "تأسست مجموعة رعاية الطفل للحضانات عام 2014 لتقدّم بيئة تعليمية آمنة ومحبة لأطفالكم، معتمدة على منهج مونتيسوري ومتوافقة مع اشتراطات هيئة الشارقة للتعليم الخاص (سبيا).",
            "Founded in 2014, Child Care Nurseries Group provides a safe, loving learning environment for your children, built on the Montessori approach and compliant with SPEA requirements."
          )}
        </p>

        <p className="text-[11px] font-bold text-slate-400 text-center mb-2">{tr("فروعنا", "Our branches")}</p>
        <div className="flex flex-wrap gap-1.5 justify-center mb-5">
          {BRANCHES.map((b) => (
            <span key={b.key} className="text-[10.5px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold">{tr(b.name.ar, b.name.en)}</span>
          ))}
        </div>

        <button onClick={onNew} className="w-full bg-sky-500 text-white font-bold py-3 rounded-xl text-sm mb-2.5 shadow-sm">
          {tr("📝 تسجيل طفل جديد في الحضانة", "📝 Register a new child")}
        </button>
        <button onClick={onExisting} className="w-full bg-white border-2 border-sky-500 text-sky-600 font-bold py-3 rounded-xl text-sm">
          {tr("عندي حساب بالفعل — تسجيل الدخول", "I already have an account — Log in")}
        </button>

        <p className="text-[10px] text-slate-400 text-center mt-4 leading-relaxed">
          {tr("ⓘ لو دي أول مرة، اضغطي \"تسجيل طفل جديد\" ومحتاجيش حساب. بعد موافقة الإدارة، هيتبعتلك رابط دخول لمتابعة كل حاجة عن طفلك.", "ⓘ First time here? Tap \"Register a new child\" — no account needed. Once approved, you'll get a login link to follow everything about your child.")}
        </p>
        <button onClick={onBranchAdmin} className="w-full text-center text-[10px] text-slate-300 font-bold mt-4">
          {tr("دخول إدارة الفرع", "Branch admin login")}
        </button>
      </div>
    </div>
  );
}

function Login({ onBack }) {
  const { lang, setLang, tr } = useLang();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const sendLink = async () => {
    setError("");
    if (!email || !email.includes("@")) {
      setError(tr("من فضلك أدخلي بريد إلكتروني صحيح", "Please enter a valid email address"));
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setSent(true);
  };

  const verifyCode = async () => {
    setError("");
    if (!code || code.trim().length < 6) {
      setError(tr("أدخلي الكود المكوّن من 6 أرقام", "Enter the 6-digit code"));
      return;
    }
    setVerifying(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    setVerifying(false);
    if (verifyError) {
      setError(tr("الكود غير صحيح أو منتهي، جرّبي تطلبي كود جديد", "Incorrect or expired code — try requesting a new one"));
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 bg-gradient-to-b from-sky-500 to-cyan-400 text-white relative">
      {onBack && (
        <button onClick={onBack} className="absolute top-4 right-4 bg-white/20 rounded-full w-8 h-8 flex items-center justify-center">
          <ChevronLeft className={`w-4 h-4 ${lang === "en" ? "rotate-180" : ""}`} />
        </button>
      )}
      <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="absolute top-4 left-4 bg-white/20 rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1">
        <Globe className="w-3.5 h-3.5" /> {lang === "ar" ? "English" : "العربية"}
      </button>
      <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8" />
      </div>
      <h1 className="text-lg font-extrabold mb-1 text-center">{tr("مجموعة رعاية الطفل للحضانات", "Child Care Nurseries Group")}</h1>
      <p className="text-sky-100 text-xs mb-8">{tr("بوابة أولياء الأمور", "Parent Portal")}</p>

      {!sent ? (
        <div className="w-full bg-white rounded-2xl p-5 shadow-xl">
          <label className="text-xs font-bold text-slate-500 block mb-1" style={{ textAlign: lang === "ar" ? "right" : "left" }}>{tr("البريد الإلكتروني", "Email address")}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={tr("مثال: name@email.com", "e.g. name@email.com")}
            style={{ textAlign: lang === "ar" ? "right" : "left" }}
            className="w-full border border-slate-200 bg-white text-slate-800 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-sky-400" />
          {error && <p className="text-xs text-rose-500 font-bold mb-3">{error}</p>}
          <button onClick={sendLink} disabled={loading} className="w-full bg-sky-500 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-sky-600 transition disabled:opacity-60">
            {loading ? tr("جارِ الإرسال...", "Sending...") : tr("إرسال رابط الدخول", "Send login link")}
          </button>
        </div>
      ) : (
        <div className="w-full bg-white rounded-2xl p-5 shadow-xl text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm text-slate-700 font-bold mb-1">{tr("تم إرسال رابط الدخول", "Login link sent")}</p>
          <p className="text-xs text-slate-400 mb-4">{tr("افتحي بريدك الإلكتروني واضغطي على الرابط للدخول تلقائياً", "Check your email and tap the link to sign in automatically")}</p>
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400 mb-2">{tr("أو أدخلي الكود المكوّن من 6 أرقام من نفس الإيميل", "Or enter the 6-digit code from the same email")}</p>
            <input type="text" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mb-3 text-center tracking-[0.3em] font-bold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400" />
            {error && <p className="text-xs text-rose-500 font-bold mb-3">{error}</p>}
            <button onClick={verifyCode} disabled={verifying} className="w-full bg-sky-500 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-sky-600 transition disabled:opacity-60">
              {verifying ? tr("جارِ التحقق...", "Verifying...") : tr("تأكيد الكود", "Confirm code")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Home ----------------
function HomeScreen({ setActiveTab, setMoreView, goBranch }) {
  const { tr } = useLang();
  return (
    <div className="px-4 py-4 space-y-3 overflow-y-auto h-full pb-4">
      <button onClick={goBranch} className="w-full flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="w-12 h-12 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-lg">{tr("ي", "Y")}</div>
        <div className="flex-1">
          <p className="font-bold text-slate-800 text-sm">{tr("يوسف أحمد", "Yousef Ahmed")}</p>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> {tr("فرع الفرحة – القاسمية · فصل البراعم", "Al Farha Branch – Al Qasimia · Baraem Class")}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300" />
      </button>

      <button onClick={() => setActiveTab("reports")} className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] text-sky-500 font-bold">{tr("التفاصيل ←", "Details →")}</span>
          <p className="font-bold text-slate-800 text-sm">{tr("لمحة اليوم", "Today's snapshot")}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <UtensilsCrossed className="w-5 h-5 mx-auto text-orange-500 mb-1" />
            <p className="text-[11px] text-slate-500">{tr("أكل الكل", "Ate all")}</p>
          </div>
          <div>
            <Droplet className="w-5 h-5 mx-auto text-sky-500 mb-1" />
            <p className="text-[11px] text-slate-500">{tr("3 أكواب", "3 cups")}</p>
          </div>
          <div>
            <Moon className="w-5 h-5 mx-auto text-indigo-500 mb-1" />
            <p className="text-[11px] text-slate-500">1:00–2:30</p>
          </div>
        </div>
      </button>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700 leading-relaxed flex-1">
          {tr("رسوم شهر أغسطس مستحقة يوم 27 — بادري بالسداد لتجنب إيقاف القبول أول الشهر.",
              "August fees are due on the 27th — pay early to avoid enrollment being paused on the 1st.")}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => setActiveTab("schedule")} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
          <CalendarDays className="w-5 h-5 mx-auto text-purple-500 mb-1" />
          <p className="text-[11px] font-bold text-slate-600">{tr("المواعيد", "Schedule")}</p>
        </button>
        <button onClick={() => { setActiveTab("more"); setMoreView("complaints"); }} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
          <MessageCircle className="w-5 h-5 mx-auto text-rose-500 mb-1" />
          <p className="text-[11px] font-bold text-slate-600">{tr("شكوى/استفسار", "Inquiry")}</p>
        </button>
        <button onClick={() => { setActiveTab("more"); setMoreView("documents"); }} className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
          <Upload className="w-5 h-5 mx-auto text-teal-500 mb-1" />
          <p className="text-[11px] font-bold text-slate-600">{tr("رفع مستند", "Documents")}</p>
        </button>
      </div>
    </div>
  );
}

// ---------------- Branch Info ----------------
function BranchScreen() {
  const { tr } = useLang();
  const b = BRANCHES[0];
  return (
    <div className="px-4 py-4 space-y-3 overflow-y-auto h-full pb-4">
      <div className="bg-gradient-to-br from-sky-500 to-cyan-400 rounded-2xl p-5 text-white">
        <Building2 className="w-6 h-6 mb-2" />
        <p className="font-extrabold text-lg">{tr(b.name.ar, b.name.en)}</p>
        <p className="text-xs text-sky-50">{tr("مجموعة رعاية الطفل للحضانات", "Child Care Nurseries Group")}</p>
      </div>

      <div className="bg-white rounded-2xl divide-y divide-slate-50 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 p-4">
          <span className="text-xs text-slate-400 flex-1">{tr("الهاتف", "Phone")}</span>
          <Phone className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-bold text-slate-700" dir="ltr">{b.phone}</span>
        </div>
        <div className="flex items-center gap-3 p-4">
          <span className="text-xs text-slate-400 flex-1">{tr("واتساب", "WhatsApp")}</span>
          <MessageCircle className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-bold text-slate-700" dir="ltr">{b.whatsapp}</span>
        </div>
        <div className="flex items-center gap-3 p-4">
          <span className="text-xs text-slate-400 flex-1">{tr(b.address.ar, b.address.en)}</span>
          <MapPin className="w-4 h-4 text-rose-500" />
          <span className="text-sm font-bold text-slate-700">{tr("العنوان", "Address")}</span>
        </div>
        <div className="flex items-center gap-3 p-4">
          <span className="text-xs text-slate-400 flex-1" dir="ltr">{b.fb}</span>
          <Facebook className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-bold text-slate-700">Facebook</span>
        </div>
        <div className="flex items-center gap-3 p-4">
          <span className="text-xs text-slate-400 flex-1" dir="ltr">{b.ig}</span>
          <Instagram className="w-4 h-4 text-pink-500" />
          <span className="text-sm font-bold text-slate-700">Instagram</span>
        </div>
        <div className="flex items-center gap-3 p-4">
          <span className="text-xs text-slate-400 flex-1" dir="ltr">{GROUP_TIKTOK}</span>
          <Music2 className="w-4 h-4 text-slate-800" />
          <span className="text-sm font-bold text-slate-700">TikTok</span>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
        <span className="text-xs text-emerald-700 flex-1 leading-relaxed">{tr("قناة واتساب عامة لكل فروع المجموعة", "General WhatsApp channel for the whole group")}<br /><span dir="ltr" className="font-bold">{GROUP_WHATSAPP_CHANNEL}</span></span>
        <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" />
      </div>
    </div>
  );
}

// ---------------- Schedule ----------------
function ScheduleScreen({ showToast }) {
  const { tr } = useLang();
  const [days, setDays] = useState({ Sunday: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true });
  const toggle = (d) => setDays((s) => ({ ...s, [d]: !s[d] }));
  return (
    <div className="px-4 py-4 space-y-3 overflow-y-auto h-full pb-4">
      <p className="text-xs text-slate-400">{tr("حدّدي أيام حضور الطفل الأسبوعية", "Select the child's weekly attendance days")}</p>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2">
        {WEEK.map((d) => {
          const { en, ar } = split(d);
          return (
            <button key={en} onClick={() => toggle(en)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-bold ${days[en] ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
              {days[en] ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              {tr(ar, en)}
            </button>
          );
        })}
      </div>
      <button onClick={() => showToast(tr("تم إرسال طلب تعديل المواعيد للإدارة", "Schedule change request sent to management"))}
        className="w-full bg-purple-500 text-white font-bold py-2.5 rounded-xl text-sm">
        {tr("حفظ المواعيد", "Save schedule")}
      </button>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        {tr("ⓘ أي تعديل في أيام الحضور يحتاج موافقة الإدارة قبل يومين على الأقل.", "ⓘ Any change to attendance days requires management approval at least 2 days in advance.")}
      </p>
    </div>
  );
}

// ---------------- Reports ----------------
function ReportsScreen({ registrationId }) {
  const { tr } = useLang();
  const [view, setView] = useState("daily");
  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 justify-center pt-3 pb-1">
        <button onClick={() => setView("daily")} className={`text-xs font-bold px-3 py-1.5 rounded-full ${view === "daily" ? "bg-slate-800 text-white" : "bg-white text-slate-400 border border-slate-200"}`}>{tr("يومي", "Daily")}</button>
        <button onClick={() => setView("monthly")} className={`text-xs font-bold px-3 py-1.5 rounded-full ${view === "monthly" ? "bg-slate-800 text-white" : "bg-white text-slate-400 border border-slate-200"}`}>{tr("التقييم الشهري", "Monthly evaluation")}</button>
      </div>
      <div className="flex-1 overflow-hidden">
        {view === "daily" ? <DailyReportsView registrationId={registrationId} /> : <MonthlyEvalView registrationId={registrationId} />}
      </div>
    </div>
  );
}

function DailyReportsView({ registrationId }) {
  const { tr } = useLang();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!registrationId) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from("daily_reports")
      .select("*")
      .eq("registration_id", registrationId)
      .order("report_date", { ascending: false })
      .limit(14)
      .then(({ data }) => { setReports(data || []); setIdx(0); setLoading(false); });
  }, [registrationId]);

  if (loading) return <p className="text-xs text-slate-400 text-center pt-10">{tr("جارِ التحميل...", "Loading...")}</p>;

  if (reports.length === 0) {
    return (
      <div className="h-full flex items-center justify-center px-8 text-center">
        <p className="text-xs text-slate-400 leading-relaxed">{tr("لسه معملش تقرير يومي لطفلك. هيظهر هنا أول ما المربية تسجّل تقرير اليوم.", "No daily report yet. It'll show up here once the teacher logs today's report.")}</p>
      </div>
    );
  }

  const r = reports[idx];

  return (
    <div className="px-4 py-4 space-y-3 overflow-y-auto h-full pb-4">
      <div className="flex gap-2 justify-center flex-wrap">
        {reports.map((rep, i) => (
          <button key={rep.id} onClick={() => setIdx(i)} className={`text-xs font-bold px-3 py-1.5 rounded-full ${i === idx ? "bg-slate-800 text-white" : "bg-white text-slate-400 border border-slate-200"}`}>
            {rep.report_date}
          </button>
        ))}
      </div>

      {r.absent ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
          <p className="text-sm font-bold text-slate-600">{tr("طفلك كان غايب في اليوم ده", "Your child was absent this day")}</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <UtensilsCrossed className="w-4 h-4 text-emerald-500" />
              <p className="font-bold text-slate-800 text-sm">{tr("الأكل والشرب", "Food & drink")}</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{r.meals || tr("مفيش تفاصيل مسجّلة", "No details recorded")}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Moon className="w-4 h-4 text-indigo-500" />
              <p className="font-bold text-slate-800 text-sm">{tr("النوم", "Sleep")}</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{r.sleep || tr("مفيش تفاصيل مسجّلة", "No details recorded")}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Smile className="w-4 h-4 text-amber-500" />
              <p className="font-bold text-slate-800 text-sm">{tr("النشاط والمزاج", "Activity & mood")}</p>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{r.activity || tr("مفيش تفاصيل مسجّلة", "No details recorded")}</p>
          </div>
        </>
      )}

      {r.notes && (
        <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100 space-y-2">
          <p className="text-xs font-bold text-sky-600">{tr("ملاحظة المربية", "Teacher's note")}</p>
          <p className="text-xs text-slate-600 leading-relaxed bg-white rounded-lg p-2">{r.notes}</p>
        </div>
      )}
    </div>
  );
}

function MonthlyEvalView({ registrationId }) {
  const { tr } = useLang();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!registrationId) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from("monthly_evaluations")
      .select("*")
      .eq("registration_id", registrationId)
      .order("month", { ascending: false })
      .then(({ data }) => { setEvaluations(data || []); setIdx(0); setLoading(false); });
  }, [registrationId]);

  if (loading) return <p className="text-xs text-slate-400 text-center pt-10">{tr("جارِ التحميل...", "Loading...")}</p>;

  if (evaluations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center px-8 text-center">
        <p className="text-xs text-slate-400 leading-relaxed">{tr("لسه معملش تقييم شهري لطفلك. هيظهر هنا أول ما المربية تسجّله.", "No monthly evaluation yet. It'll show up here once the teacher logs it.")}</p>
      </div>
    );
  }

  const e = evaluations[idx];
  const ratings = e.ratings || {};
  const observations = e.observations || {};
  const nextSteps = e.next_steps || {};

  return (
    <div className="px-4 py-4 space-y-3 overflow-y-auto h-full pb-4">
      <div className="flex gap-2 justify-center flex-wrap">
        {evaluations.map((ev, i) => (
          <button key={ev.id} onClick={() => setIdx(i)} className={`text-xs font-bold px-3 py-1.5 rounded-full ${i === idx ? "bg-slate-800 text-white" : "bg-white text-slate-400 border border-slate-200"}`}>
            {ev.month}
          </button>
        ))}
      </div>

      {e.teacher_name && <p className="text-xs text-slate-400 text-center">{tr("بواسطة", "By")} {e.teacher_name}</p>}

      {DOMAINS.map((d) => {
        const rating = ratings[d.id] || 0;
        if (!rating && !observations[d.id] && !nextSteps[d.id]) return null;
        return (
          <div key={d.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div dir="ltr">{"★".repeat(rating)}{"☆".repeat(5 - rating)}</div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-800 text-sm">{tr(d.ar, d.en)}</p>
                <span>{d.icon}</span>
              </div>
            </div>
            {observations[d.id] && <p className="text-xs text-slate-600 leading-relaxed mb-1">{observations[d.id]}</p>}
            {nextSteps[d.id] && <p className="text-[11px] text-sky-600 leading-relaxed">{tr("الخطوة القادمة: ", "Next step: ")}{nextSteps[d.id]}</p>}
          </div>
        );
      })}

      {e.general_note && (
        <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100 space-y-2">
          <p className="text-xs font-bold text-sky-600">{tr("ملاحظة عامة", "General note")}</p>
          <p className="text-xs text-slate-600 leading-relaxed bg-white rounded-lg p-2">{e.general_note}</p>
        </div>
      )}
    </div>
  );
}

// ---------------- Fees ----------------
function FeesScreen({ registrationId }) {
  const { tr } = useLang();
  const [reg, setReg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!registrationId) { setLoading(false); return; }
    supabase
      .from("portal_registrations")
      .select("branch, documents, fee_adjustments")
      .eq("id", registrationId)
      .single()
      .then(({ data }) => { setReg(data); setLoading(false); });
  }, [registrationId]);

  if (loading) return <p className="text-xs text-slate-400 text-center pt-10">{tr("جارِ التحميل...", "Loading...")}</p>;
  if (!reg) return <p className="text-xs text-slate-400 text-center pt-10 px-8">{tr("مفيش بيانات رسوم لسه.", "No fee details yet.")}</p>;

  const billing = reg.documents?.billing || {};
  const fa = reg.fee_adjustments;
  const recurring = Number(billing.recurring_fee) || 0;
  const freqAr = { monthly: "شهري", weekly: "أسبوعي", daily: "يومي" }[billing.frequency] || "";
  const freqEn = billing.frequency || "";
  const amt = (x) => (x === null || x === undefined ? null : Number(x));
  const items = [
    { ar: "رسوم التسجيل", en: "Registration", v: amt(fa?.registration_fee) },
    { ar: "رسوم الفحص الطبي", en: "Medical", v: amt(fa?.medical_fee) },
    { ar: "رسوم الزي", en: "Uniform", v: amt(fa?.uniform_fee) },
  ];
  const oneTime = items.reduce((s, i) => s + (i.v || 0), 0);
  const pctOff = Math.round((recurring * (Number(fa?.discount_percent) || 0)) / 100);
  const amtOff = Number(fa?.discount_amount) || 0;
  const total = Math.max(0, recurring - pctOff + oneTime - amtOff);
  const branch = BRANCHES.find((b) => b.key === reg.branch);
  const row = (label, value, cls = "") => (
    <div className={`flex items-center justify-between text-xs py-2 border-b border-slate-50 last:border-0 ${cls}`}>
      <span className="font-bold">{value}</span>
      <span className="text-slate-500">{label}</span>
    </div>
  );

  return (
    <div className="px-4 py-4 space-y-3 overflow-y-auto h-full pb-4">
      <div className="bg-gradient-to-br from-sky-600 to-cyan-500 rounded-2xl p-5 text-white">
        <p className="text-xs text-sky-100 mb-1">{fa ? tr("إجمالي المستحق للتسجيل", "Total due for registration") : tr("الرسوم الدورية", "Recurring fee")}</p>
        <p className="text-2xl font-extrabold">{tr(`${fa ? total : recurring} د.إ`, `AED ${fa ? total : recurring}`)}</p>
        {!fa && <p className="text-[11px] text-sky-100 mt-1">{tr("رسوم التسجيل والطبي والزي هتحدّدها الإدارة قريباً.", "Registration, medical and uniform fees will be set by management soon.")}</p>}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <p className="font-bold text-slate-800 text-sm mb-2">{tr("تفاصيل الرسوم", "Fee details")}</p>
        {row(tr(`الرسوم الدورية (${freqAr})`, `Recurring fee (${freqEn})`), tr(`${recurring} د.إ`, `AED ${recurring}`))}
        {items.map((i) => row(tr(i.ar, i.en), i.v === null ? tr("تحدّدها الإدارة", "Set by management") : tr(`${i.v} د.إ`, `AED ${i.v}`), i.v === null ? "text-amber-600" : ""))}
        {pctOff > 0 && row(tr(`خصم ${fa.discount_percent}%`, `${fa.discount_percent}% discount`), tr(`− ${pctOff} د.إ`, `− AED ${pctOff}`), "text-emerald-600")}
        {amtOff > 0 && row(tr("خصم", "Discount"), tr(`− ${amtOff} د.إ`, `− AED ${amtOff}`), "text-emerald-600")}
        {fa?.offer_note && <p className="text-[11px] text-emerald-700 bg-emerald-50 rounded-lg px-2.5 py-1.5 mt-2 text-right">🎁 {fa.offer_note}</p>}
      </div>

      {branch && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-[11px] text-emerald-700 leading-relaxed space-y-0.5">
          <p className="font-bold text-xs">{tr("بيانات التحويل البنكي", "Bank transfer details")}</p>
          <p>{branch.bank.holder}</p>
          <p dir="ltr">IBAN: {branch.bank.iban}</p>
          <p dir="ltr">BIC/SWIFT: {branch.bank.bic}</p>
          <p>{branch.bank.bank}</p>
        </div>
      )}
    </div>
  );
}

// ---------------- Register (simplified 7-step form) ----------------
const DRAFT_KEY = "ccn_registration_draft_v2";
const imgUrl = (name) => `${import.meta.env.BASE_URL}img/${name}`;
const STEP_META = [
  { emoji: "👶", img: "dance.jpg", ar: "بطلنا الصغير", en: "Your little star", hintAr: "نفسنا نتعرّف على طفلك 💙", hintEn: "We'd love to meet your child 💙" },
  { emoji: "👨‍👩‍👧", img: "entrance.jpg", ar: "الوالدان", en: "Parents", hintAr: "بيانات للتواصل معاكم", hintEn: "How we can reach you" },
  { emoji: "🛡️", img: "graduation.jpg", ar: "الطوارئ والاستلام", en: "Safety & pickup", hintAr: "علشان طفلك دايماً في أمان", hintEn: "So your child is always safe" },
  { emoji: "🩺", img: "dance.jpg", ar: "صحة طفلك", en: "Health", hintAr: "نص الطريق خلص! كمّلي 🎉", hintEn: "Halfway there! 🎉" },
  { emoji: "🌈", img: "entrance.jpg", ar: "عن طفلك ومهاراته", en: "About & Skills", hintAr: "نفسنا نعرف شخصيته الحلوة 🌈", hintEn: "Tell us about their personality 🌈" },
  { emoji: "🗓️", img: "dance.jpg", ar: "الخطة والرسوم", en: "Plan & fees", hintAr: "اختاري المواعيد المناسبة ليكي", hintEn: "Pick the schedule that suits you" },
  { emoji: "📎", img: "graduation.jpg", ar: "المستندات", en: "Documents", hintAr: "صور واضحة من الموبايل كفاية", hintEn: "Clear phone photos are enough" },
  { emoji: "✍️", img: "dance.jpg", ar: "الموافقات والتوقيع", en: "Consent & signature", hintAr: "آخر خطوة — يلا بينا! 🎈", hintEn: "Last step — almost done! 🎈" },
];

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_e) {
    return null;
  }
}

function SectionCard({ emoji, title, color = "sky", children }) {
  const colors = {
    sky: "border-sky-100 bg-sky-50/60",
    pink: "border-pink-100 bg-pink-50/60",
    amber: "border-amber-100 bg-amber-50/70",
    emerald: "border-emerald-100 bg-emerald-50/60",
  };
  return (
    <div className={`rounded-3xl border p-3.5 space-y-3 ${colors[color]}`}>
      <p className="text-sm font-extrabold text-slate-700 text-right">{emoji} {title}</p>
      {children}
    </div>
  );
}

function Collapse({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-3.5 py-3">
        <ChevronLeft className={`w-4 h-4 text-slate-400 transition ${open ? "-rotate-90" : ""}`} />
        <span className="text-xs font-bold text-slate-600">{title}</span>
      </button>
      {open && <div className="px-3.5 pb-3.5 space-y-3">{children}</div>}
    </div>
  );
}

function YesNoDetail({ label, value, detail, onValue, onDetail }) {
  const { tr } = useLang();
  return (
    <div className="space-y-2">
      <YesNo label={label} value={value} onChange={onValue} />
      {value === "yes" && (
        <Field label={tr("اكتبي التفاصيل", "Please give details")} value={detail} onChange={onDetail} req />
      )}
    </div>
  );
}

function RegisterForm({ onBack, showToast, standalone }) {
  const { tr, lang } = useLang();
  const today = new Date().toISOString().slice(0, 10);
  const draft = useRef(loadDraft()).current;
  const [step, setStep] = useState(draft?.step || 0);
  const [f, setF] = useState(draft?.f || { sigDate: today, frequency: "monthly" });
  const [submitting, setSubmitting] = useState(false);
  const [regId] = useState(() => draft?.regId || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`));
  const [files, setFiles] = useState(draft?.files || {});
  const [restored] = useState(!!draft);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const setEv = (k) => (e) => set(k)(e.target.value);
  const setArrayItem = (key, idx, field) => (e) =>
    setF((s) => {
      const arr = [...(s[key] || [])];
      arr[idx] = { ...arr[idx], [field]: e.target.value };
      return { ...s, [key]: arr };
    });
  const setConsent = (k, v) => setF((s) => ({ ...s, consents: { ...(s.consents || {}), [k]: v } }));

  // Autosave so a parent never loses progress if the page closes.
  useEffect(() => {
    try {
      const { signatureDataUrl, ...rest } = f;
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ f: rest, step, regId, files }));
    } catch (_e) { /* storage unavailable */ }
  }, [f, step, regId, files]);

  const uploadFile = async (key, file) => {
    setFiles((s) => ({ ...s, [key]: { status: "uploading", name: file.name } }));
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${regId}/${key}-${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("registration-documents").upload(path, file);
    if (error) {
      setFiles((s) => ({ ...s, [key]: { status: "error", name: file.name, error: error.message } }));
      return;
    }
    setFiles((s) => ({ ...s, [key]: { status: "done", name: file.name, path } }));
  };
  const anyUploading = Object.values(files).some((x) => x.status === "uploading");

  const steps = STEP_META.map((m) => tr(m.ar, m.en));
  const meta = STEP_META[step];

  const yesNoDetailOk = (val, detail) => !!val && (val === "no" || !!detail);
  const emailOk = (e) => /^\S+@\S+\.\S+$/.test((e || "").trim());
  const parentOk = (p) => !!(f[`${p}Name`] && f[`${p}Id`] && f[`${p}Mobile`] && emailOk(f[`${p}Email`]));

  const stepValid = () => {
    switch (step) {
      case 0:
        return !!(f.branch && f.name && f.dob && f.gender && f.nat && (f.nat !== "Other" || f.natOther) && f.address);
      case 1:
        return !!f.marital && (f.marital === "widowed" ? (parentOk("f") || parentOk("m")) : (parentOk("f") && parentOk("m")));
      case 2:
        return !!(f.emName && f.emRel && f.emMobile);
      case 3:
        return yesNoDetailOk(f.illness, f.illnessDetail) &&
          yesNoDetailOk(f.meds, f.medsDetail) &&
          yesNoDetailOk(f.allergy, f.allergyDetail) &&
          yesNoDetailOk(f.special, f.specialDetail) &&
          !!(f.blood && f.vax);
      case 4:
        return !!(f.order && f.hobbies && f.colors && f.personality && f.loves && f.fears &&
          (f.skillsNone || Object.values(f.skills || {}).some(Boolean)));
      case 5:
        return !!(f.plan && f.transportPlan);
      case 6:
        return files.fatherId?.status === "done" && files.motherId?.status === "done" &&
          files.childPhoto?.status === "done" &&
          (files.vaxCard?.status === "done" || !!f.vaxPledge);
      case 7:
        return CONSENTS.every((c) => f.consents?.[c.key]) && !!f.media &&
          !!(f.sigName && f.sigId && f.sigDate && f.signatureDataUrl);
      default:
        return true;
    }
  };

  const next = () => { if (stepValid()) setStep((s) => Math.min(s + 1, steps.length - 1)); };
  const back = () => (step === 0 ? onBack() : setStep((s) => s - 1));
  const remainingMin = Math.max(1, Math.round(((steps.length - step) * 0.8)));

  const submit = async () => {
    setSubmitting(true);
    const formData = { ...f, termsVersion: TERMS_VERSION, consentedAt: new Date().toISOString(), consentLang: lang };
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const contactEmail = f.fEmail || f.mEmail || user?.email || null;
    const selectedBranch = BRANCHES.find((b) => b.name.en === f.branch);
    const freq = f.frequency || "monthly";
    const selectedPlan = PLANS.find((p) => p.key === f.plan);
    const selectedTransport = TRANSPORT_OPTIONS.find((t) => t.key === f.transportPlan);
    const selectedWeekendDays = WEEKEND_DAYS.filter((d) => (f.weekendDays || {})[d.key]);
    const weekendFee = freq === "daily" ? 0 : selectedWeekendDays.reduce((sum, d) => sum + (d[freq] || 0), 0);
    const recurringFee = (selectedPlan?.[freq] || 0) + (selectedTransport?.[freq] || 0) + weekendFee;

    let signaturePath = null;
    if (f.signatureDataUrl) {
      const signatureBlob = await (await fetch(f.signatureDataUrl)).blob();
      const path = `${regId}/signature-${Date.now()}.png`;
      const { error: sigErr } = await supabase.storage.from("registration-documents").upload(path, signatureBlob, { contentType: "image/png" });
      if (!sigErr) signaturePath = path;
    }

    let fullFormPath = null;
    try {
      const pdfBlob = await generateFormPdfBlob({
        f: formData,
        branchLabel: selectedBranch ? selectedBranch.name.ar : f.branch,
        billing: { recurring_fee: recurringFee, one_time_fee: null },
        signatureDataUrl: f.signatureDataUrl || null,
      });
      const pdfPath = `${regId}/full-form-${Date.now()}.pdf`;
      const { error: pdfErr } = await supabase.storage.from("registration-documents").upload(pdfPath, pdfBlob, { contentType: "application/pdf" });
      if (!pdfErr) fullFormPath = pdfPath;
    } catch (_e) {
      fullFormPath = null;
    }

    const { error } = await supabase.from("portal_registrations").insert({
      branch: selectedBranch?.key || f.branch || null,
      contact_email: contactEmail,
      parent_user_id: user?.id || null,
      form_data: formData,
      documents: {
        father_id: files.fatherId?.path || null,
        mother_id: files.motherId?.path || null,
        child_id: files.childId?.path || null,
        child_photo: files.childPhoto?.path || null,
        vaccination_card: files.vaxCard?.path || null,
        vaccination_pledge: !!f.vaxPledge,
        full_form_pdf: fullFormPath,
        signature: signaturePath,
        billing: {
          frequency: freq,
          plan_key: selectedPlan?.key || null,
          plan_label: selectedPlan?.label.en || null,
          transport_key: selectedTransport?.key || null,
          weekend_days: selectedWeekendDays.map((d) => d.key),
          recurring_fee: recurringFee,
          one_time_fee: null,
          one_time_items: ONE_TIME_ITEMS.map((i) => i.key),
          promo_code: f.promoCode || null,
        },
      },
    });
    setSubmitting(false);
    if (error) {
      showToast(tr("حصل خطأ أثناء إرسال الاستمارة، حاولي مرة أخرى", "Something went wrong submitting the form, please try again"));
      return;
    }
    try { localStorage.removeItem(DRAFT_KEY); } catch (_e) { /* ignore */ }
    if (standalone) {
      showToast(tr("تم استلام طلبك! هتتراجع الإدارة عليه وتبعتلك رابط الدخول بعد الموافقة", "Application received! Management will review it and send your login link after approval"));
      setTimeout(onBack, 2600);
    } else {
      showToast(tr("تم إرسال استمارة التسجيل بنجاح", "Registration form submitted successfully"));
    }
  };

  const [showRestored, setShowRestored] = useState(restored);
  const startOver = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch (_e) { /* ignore */ }
    setF({ sigDate: today, frequency: "monthly" });
    setFiles({});
    setStep(0);
    setShowRestored(false);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-amber-50/60 to-white">
      <div className="relative h-28 shrink-0 overflow-hidden">
        <img src={imgUrl(meta.img)} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/25 to-sky-500/30" />
        <button onClick={back} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/25 backdrop-blur flex items-center justify-center text-white">
          <ChevronLeft className={`w-4 h-4 ${lang === "en" ? "rotate-180" : ""}`} />
        </button>
        <div className="absolute bottom-2.5 inset-x-4 text-white text-right">
          <p className="text-lg font-extrabold drop-shadow">{meta.emoji} {tr(meta.ar, meta.en)}</p>
          <p className="text-[11px] opacity-90">{tr(meta.hintAr, meta.hintEn)}</p>
        </div>
      </div>

      <div className="px-4 pt-2.5 pb-1">
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-l from-amber-400 to-orange-500 transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
        <p className="text-[10.5px] text-slate-400 mt-1 text-center">
          {tr(`الخطوة ${step + 1} من ${steps.length} · باقي حوالي ${remainingMin} دقيقة`, `Step ${step + 1} of ${steps.length} · about ${remainingMin} min left`)}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-3">
        {showRestored && (
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3 flex items-center justify-between gap-2">
            <button onClick={startOver} className="text-[11px] font-bold text-rose-500 shrink-0">{tr("ابدأي من جديد", "Start over")}</button>
            <p className="text-[11px] text-sky-700 text-right">{tr("رجّعنالك بياناتك المحفوظة 💾", "We restored your saved progress 💾")}</p>
          </div>
        )}

        {step === 0 && (<>
          <SectionCard emoji="🏫" title={tr("اختاري الفرع", "Choose the branch")} color="amber">
            <Select label="" options={BRANCHES.map((b) => `${b.name.en}|${b.name.ar}`)} value={f.branch} onChange={set("branch")} />
          </SectionCard>
          <SectionCard emoji="🧒" title={tr("بيانات الطفل", "Child details")} color="sky">
            <Field req label={tr("اسم الطفل رباعياً", "Child's full name")} value={f.name} onChange={setEv("name")} />
            <Field label={tr("اسم الشهرة (اختياري)", "Nickname (optional)")} value={f.nick} onChange={setEv("nick")} />
            <Field req label={tr("تاريخ الميلاد", "Date of birth")} type="date" value={f.dob} onChange={setEv("dob")} />
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {["boy", "girl"].map((v) => (
                  <button key={v} type="button" onClick={() => set("gender")(v)} className={`text-xs px-4 py-2 rounded-full border font-bold ${f.gender === v ? "bg-sky-500 text-white border-sky-500" : "bg-white text-slate-500 border-slate-200"}`}>
                    {v === "boy" ? tr("👦 ذكر", "👦 Boy") : tr("👧 أنثى", "👧 Girl")}
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-slate-600">{tr("النوع", "Gender")} <span className="text-rose-500">*</span></span>
            </div>
            <Select req label={tr("الجنسية", "Nationality")} options={NATIONALITIES} value={f.nat} onChange={set("nat")} other={f.natOther} onOtherChange={setEv("natOther")} />
            <Field req label={tr("عنوان السكن", "Home address")} value={f.address} onChange={setEv("address")} autoComplete="street-address" />
          </SectionCard>
          <Collapse title={tr("معلومات إضافية (اختياري)", "More details (optional)")}>
            <Select label={tr("الديانة", "Religion")} options={RELIGIONS} value={f.religion} onChange={set("religion")} other={f.religionOther} onOtherChange={setEv("religionOther")} />
            <Select label={tr("اللغة الأولى للطفل", "Child's first language")} options={LANGUAGES} value={f.lang1} onChange={set("lang1")} other={f.lang1Other} onOtherChange={setEv("lang1Other")} />
          </Collapse>
        </>)}

        {step === 1 && (<>
          <SectionCard emoji="👨" title={tr("الأب", "Father")} color="sky">
            <Field req label={tr("الاسم", "Name")} value={f.fName} onChange={setEv("fName")} />
            <Field req label={tr("رقم الهوية الإماراتية / الجواز", "Emirates ID / Passport no.")} value={f.fId} onChange={setEv("fId")} inputMode="numeric" />
            <Field req label={tr("رقم الجوال", "Mobile")} type="tel" value={f.fMobile} onChange={setEv("fMobile")} inputMode="tel" autoComplete="tel" ltr />
            <Field req label={tr("البريد الإلكتروني", "Email")} type="email" value={f.fEmail} onChange={setEv("fEmail")} inputMode="email" autoComplete="email" ltr />
            <Field label={tr("الوظيفة (اختياري)", "Occupation (optional)")} value={f.fJob} onChange={setEv("fJob")} />
          </SectionCard>
          <SectionCard emoji="👩" title={tr("الأم", "Mother")} color="pink">
            <Field req label={tr("الاسم", "Name")} value={f.mName} onChange={setEv("mName")} />
            <Field req label={tr("رقم الهوية الإماراتية / الجواز", "Emirates ID / Passport no.")} value={f.mId} onChange={setEv("mId")} inputMode="numeric" />
            <Field req label={tr("رقم الجوال", "Mobile")} type="tel" value={f.mMobile} onChange={setEv("mMobile")} inputMode="tel" ltr />
            <Field req label={tr("البريد الإلكتروني", "Email")} type="email" value={f.mEmail} onChange={setEv("mEmail")} inputMode="email" ltr />
            <Field label={tr("الوظيفة (اختياري)", "Occupation (optional)")} value={f.mJob} onChange={setEv("mJob")} />
          </SectionCard>
          <SectionCard emoji="💍" title={tr("الحالة الاجتماعية للوالدين", "Parents' marital status")} color="amber">
            <Select req label="" options={["married|متزوجان", "separated|منفصلان", "widowed|أرمل/أرملة"]} value={f.marital} onChange={set("marital")} />
            {f.marital === "widowed" && <p className="text-[11px] text-amber-700 text-right">{tr("يكفي إدخال بيانات أحد الوالدين.", "Details of one parent are enough.")}</p>}
          </SectionCard>
        </>)}

        {step === 2 && (<>
          <SectionCard emoji="🚨" title={tr("جهة اتصال للطوارئ", "Emergency contact")} color="pink">
            <Field req label={tr("الاسم", "Name")} value={f.emName} onChange={setEv("emName")} />
            <Field req label={tr("صلة القرابة", "Relationship")} value={f.emRel} onChange={setEv("emRel")} />
            <Field req label={tr("رقم الجوال", "Mobile")} type="tel" value={f.emMobile} onChange={setEv("emMobile")} inputMode="tel" ltr />
          </SectionCard>
          <SectionCard emoji="🤝" title={tr("المصرّح لهم باستلام الطفل (اختياري)", "Authorized pickup persons (optional)")} color="emerald">
            <p className="text-[11px] text-emerald-700 text-right leading-relaxed">{tr("لن يُسلَّم الطفل إلا لوالديه أو لشخص مذكور هنا مع إبراز الهوية.", "The child is released only to the parents or someone listed here, with ID shown.")}</p>
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white border border-emerald-100 rounded-2xl p-3 space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400 text-right">{tr(`الشخص ${i + 1}`, `Person ${i + 1}`)}</p>
                <input placeholder={tr("الاسم", "Name")} value={f.pickupPersons?.[i]?.name || ""} onChange={setArrayItem("pickupPersons", i, "name")} className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs" />
                <div className="grid grid-cols-2 gap-1.5">
                  <input placeholder={tr("صلة القرابة", "Relationship")} value={f.pickupPersons?.[i]?.relation || ""} onChange={setArrayItem("pickupPersons", i, "relation")} className="border border-slate-200 rounded-xl px-2.5 py-2 text-xs" />
                  <input placeholder={tr("رقم الهاتف", "Phone")} inputMode="tel" value={f.pickupPersons?.[i]?.phone || ""} onChange={setArrayItem("pickupPersons", i, "phone")} className="border border-slate-200 rounded-xl px-2.5 py-2 text-xs" />
                </div>
                <input placeholder={tr("رقم الهوية", "ID number")} value={f.pickupPersons?.[i]?.idNumber || ""} onChange={setArrayItem("pickupPersons", i, "idNumber")} className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs" />
              </div>
            ))}
          </SectionCard>
          <Collapse title={tr("إخوة الطفل (اختياري)", "Siblings (optional)")}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid grid-cols-3 gap-1.5">
                <input placeholder={tr("الاسم", "Name")} value={f.siblings?.[i]?.name || ""} onChange={setArrayItem("siblings", i, "name")} className="border border-slate-200 rounded-xl px-2 py-2 text-xs" />
                <input placeholder={tr("الميلاد", "DOB")} value={f.siblings?.[i]?.dob || ""} onChange={setArrayItem("siblings", i, "dob")} className="border border-slate-200 rounded-xl px-2 py-2 text-xs" />
                <input placeholder={tr("المدرسة", "School")} value={f.siblings?.[i]?.school || ""} onChange={setArrayItem("siblings", i, "school")} className="border border-slate-200 rounded-xl px-2 py-2 text-xs" />
              </div>
            ))}
          </Collapse>
        </>)}

        {step === 3 && (<>
          <SectionCard emoji="🩺" title={tr("الحالة الصحية", "Health")} color="emerald">
            <YesNoDetail label={tr("أمراض مزمنة؟", "Chronic illness?")} value={f.illness} detail={f.illnessDetail} onValue={set("illness")} onDetail={setEv("illnessDetail")} />
            <YesNoDetail label={tr("أدوية منتظمة؟", "Regular medication?")} value={f.meds} detail={f.medsDetail} onValue={set("meds")} onDetail={setEv("medsDetail")} />
            <YesNoDetail label={tr("حساسية (أطعمة/أدوية)؟", "Allergies (food/medicine)?")} value={f.allergy} detail={f.allergyDetail} onValue={set("allergy")} onDetail={setEv("allergyDetail")} />
            <YesNoDetail label={tr("احتياجات خاصة / متابعة علاجية؟", "Special needs / ongoing therapy?")} value={f.special} detail={f.specialDetail} onValue={set("special")} onDetail={setEv("specialDetail")} />
            <YesNo label={tr("التطعيمات مكتملة؟", "Vaccinations up to date?")} value={f.vax} onChange={set("vax")} />
            <Select req label={tr("فصيلة الدم", "Blood type")} options={BLOOD} value={f.blood} onChange={set("blood")} />
          </SectionCard>
        </>)}

        {step === 4 && (<>
          <SectionCard emoji="🌈" title={tr("شخصية طفلك واهتماماته", "Personality & interests")} color="pink">
            <Select req label={tr("ترتيبه بين إخوته", "Birth order")} options={["only|الوحيد", "first|الأكبر", "middle|الأوسط", "last|الأصغر"]} value={f.order} onChange={set("order")} />
            <Select req label={tr("شخصية الطفل", "Personality")} options={PERSONALITY} value={f.personality} onChange={set("personality")} />
            <Field req label={tr("هواياته / ألعابه المفضلة", "Favorite hobbies / toys")} value={f.hobbies} onChange={setEv("hobbies")} />
            <Field req label={tr("ألوانه المفضلة", "Favorite colors")} value={f.colors} onChange={setEv("colors")} />
            <Field req label={tr("أكتر حاجة بيحبها", "What they love most")} value={f.loves} onChange={setEv("loves")} />
            <Field req label={tr("أكتر حاجة بتخوّفه", "What scares them most")} value={f.fears} onChange={setEv("fears")} />
          </SectionCard>
          <SectionCard emoji="⭐" title={tr("مهارات الطفل (اختاري كل اللي ينطبق) *", "Child's skills (tick all that apply) *")} color="amber">
            {SKILLS.map((sk) => {
              const { en, ar } = split(sk);
              const on = !!(f.skills || {})[en];
              return (
                <button key={en} type="button" onClick={() => setF((s) => ({ ...s, skillsNone: false, skills: { ...(s.skills || {}), [en]: !on } }))}
                  className={`w-full flex items-center gap-2.5 text-right rounded-2xl border p-2.5 ${on ? "bg-white border-amber-400" : "bg-white border-slate-200"}`}>
                  <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${on ? "bg-amber-500 border-amber-500" : "border-slate-300"}`}>{on && <Check className="w-3.5 h-3.5 text-white" />}</span>
                  <span className="text-xs font-bold text-slate-700 flex-1">{tr(ar, en)}</span>
                </button>
              );
            })}
            <button type="button" onClick={() => setF((s) => ({ ...s, skills: {}, skillsNone: !s.skillsNone }))}
              className={`w-full flex items-center gap-2.5 text-right rounded-2xl border p-2.5 ${f.skillsNone ? "bg-white border-slate-500" : "bg-white border-slate-200"}`}>
              <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${f.skillsNone ? "bg-slate-600 border-slate-600" : "border-slate-300"}`}>{f.skillsNone && <Check className="w-3.5 h-3.5 text-white" />}</span>
              <span className="text-xs font-bold text-slate-500 flex-1">{tr("لسه مفيش مهارات من دي", "None of these yet")}</span>
            </button>
          </SectionCard>
          <Collapse title={tr("عادات يومية (اختياري)", "Daily habits (optional)")}>
            <Field label={tr("أطعمة لا يتناولها (لأي سبب)", "Foods not allowed (any reason)")} value={f.foodNo} onChange={setEv("foodNo")} />
            <Field label={tr("أطعمة مفضلة", "Favorite foods")} value={f.foodLike} onChange={setEv("foodLike")} />
            <YesNo label={tr("ينام بمفرده؟", "Sleeps alone?")} value={f.sleepAlone} onChange={set("sleepAlone")} />
            <YesNo label={tr("يستخدم لهاية/رضّاعة؟", "Uses pacifier/bottle?")} value={f.pacifier} onChange={set("pacifier")} />
          </Collapse>
        </>)}

        {step === 5 && (<>
          <p className="text-xs font-bold text-slate-500">{tr("طريقة الدفع", "Payment frequency")}</p>
          <div className="flex gap-1.5 justify-end">
            {FREQUENCIES.map((fr) => (
              <button key={fr.key} type="button" onClick={() => set("frequency")(fr.key)}
                className={`text-[11px] px-3 py-1.5 rounded-full border font-bold ${(f.frequency || "monthly") === fr.key ? "bg-sky-500 text-white border-sky-500" : "bg-white text-slate-500 border-slate-200"}`}>
                {tr(fr.label.ar, fr.label.en)}
              </button>
            ))}
          </div>

          <p className="text-xs font-bold text-slate-500 pt-2">{tr("خطة الدوام (الاثنين - الخميس)", "Attendance plan (Mon-Thu)")}</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">{tr("من الساعة", "From")}</label>
              <select value={f.planFrom || ""} onChange={(e) => {
                const from = e.target.value;
                setF((s) => {
                  const match = PLANS.find((p) => p.from === from && p.to === s.planTo);
                  return { ...s, planFrom: from, plan: match ? match.key : "" };
                });
              }} className="w-full border border-slate-200 rounded-xl px-2 py-2 text-xs">
                <option value="">—</option>
                {PLAN_TIMES.map((t) => (<option key={t.key} value={t.key}>{tr(t.label.ar, t.label.en)}</option>))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">{tr("إلى الساعة", "To")}</label>
              <select value={f.planTo || ""} onChange={(e) => {
                const to = e.target.value;
                setF((s) => {
                  const match = PLANS.find((p) => p.from === s.planFrom && p.to === to);
                  return { ...s, planTo: to, plan: match ? match.key : "" };
                });
              }} className="w-full border border-slate-200 rounded-xl px-2 py-2 text-xs">
                <option value="">—</option>
                {PLAN_TIMES.map((t) => (<option key={t.key} value={t.key}>{tr(t.label.ar, t.label.en)}</option>))}
              </select>
            </div>
          </div>
          {f.planFrom && f.planTo && (() => {
            const freq = f.frequency || "monthly";
            const matched = PLANS.find((p) => p.from === f.planFrom && p.to === f.planTo);
            return matched ? (
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs font-bold text-sky-700">{tr(`${matched[freq]} د.إ`, `AED ${matched[freq]}`)}</span>
                <span className="text-xs text-sky-600">{tr(matched.label.ar, matched.label.en)}</span>
              </div>
            ) : (
              <p className="text-xs text-rose-500 font-bold">{tr("الميعاد ده مش متاح، اختاري ميعاد تاني", "This schedule isn't available, pick another time")}</p>
            );
          })()}

          <p className="text-xs font-bold text-slate-500 pt-2">{tr("المواصلات", "Transportation")}</p>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {TRANSPORT_OPTIONS.map((t) => {
              const freq = f.frequency || "monthly";
              return (
                <button key={t.key} type="button" onClick={() => set("transportPlan")(t.key)}
                  className={`text-[11px] px-3 py-1.5 rounded-full border font-bold ${f.transportPlan === t.key ? "bg-sky-500 text-white border-sky-500" : "bg-white text-slate-500 border-slate-200"}`}>
                  {tr(t.label.ar, t.label.en)}{t[freq] ? ` (+${t[freq]})` : ""}
                </button>
              );
            })}
          </div>

          {f.frequency !== "daily" && (<>
            <p className="text-xs font-bold text-slate-500 pt-2">{tr("إضافة أيام نهاية الأسبوع (رسوم إضافية)", "Add weekend days (extra fees)")}</p>
            <div className="flex gap-1.5 flex-wrap justify-end">
              {WEEKEND_DAYS.map((d) => {
                const freq = f.frequency || "monthly";
                const checked = !!(f.weekendDays || {})[d.key];
                return (
                  <button key={d.key} type="button"
                    onClick={() => setF((s) => ({ ...s, weekendDays: { ...(s.weekendDays || {}), [d.key]: !(s.weekendDays || {})[d.key] } }))}
                    className={`text-[11px] px-3 py-1.5 rounded-full border font-bold ${checked ? "bg-purple-500 text-white border-purple-500" : "bg-white text-slate-500 border-slate-200"}`}>
                    {tr(d.label.ar, d.label.en)} (+{d[freq]})
                  </button>
                );
              })}
            </div>
          </>)}

          {(() => {
            const freq = f.frequency || "monthly";
            const plan = PLANS.find((p) => p.key === f.plan);
            const transport = TRANSPORT_OPTIONS.find((t) => t.key === f.transportPlan);
            const weekendTotal = WEEKEND_DAYS.reduce((sum, d) => sum + ((f.weekendDays || {})[d.key] ? d[freq] || 0 : 0), 0);
            const recurringTotal = (plan?.[freq] || 0) + (transport?.[freq] || 0) + weekendTotal;
            const freqLabel = FREQUENCIES.find((fr) => fr.key === freq);
            const branch = BRANCHES.find((b) => b.name.en === f.branch);
            return (
              <>
                <div className="bg-slate-800 rounded-2xl p-4 text-white space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold">{plan ? tr(`${recurringTotal} د.إ`, `AED ${recurringTotal}`) : "—"}</span>
                    <span className="text-slate-300">{tr(`الرسوم المتوقعة (${tr(freqLabel.label.ar, freqLabel.label.en)})`, `Estimated fees (${freqLabel.label.en})`)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300">{tr("تحدّدها الإدارة", "Set by management")}</span>
                    <span className="text-slate-300">{tr("رسوم لمرة واحدة (التسجيل + الطبي + الزي)", "One-time fees (registration + medical + uniform)")}</span>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-2">
                  <p className="text-xs font-bold text-amber-800 text-right">{tr("🎁 عندك كود خصم أو عرض؟ (اختياري)", "🎁 Have a discount code or offer? (optional)")}</p>
                  <Field label="" value={f.promoCode} onChange={setEv("promoCode")} />
                  <p className="text-[10.5px] text-amber-700 text-right">{tr("الإدارة هتراجع الكود وتطبّق الخصم على رسومك.", "Management will review the code and apply the discount to your fees.")}</p>
                </div>
                {branch && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-700 leading-relaxed space-y-0.5">
                    <p className="font-bold">{tr("بيانات التحويل البنكي (فرع " + tr(branch.name.ar, branch.name.en) + ")", "Bank transfer details (" + tr(branch.name.ar, branch.name.en) + " branch)")}</p>
                    <p>{branch.bank.holder}</p>
                    <p dir="ltr">IBAN: {branch.bank.iban}</p>
                    <p dir="ltr">BIC/SWIFT: {branch.bank.bic}</p>
                    <p>{branch.bank.bank}</p>
                  </div>
                )}
              </>
            );
          })()}
        </>)}

        {step === 6 && (<>
          <p className="text-xs text-slate-400">{tr("ارفعي صور واضحة للمستندات التالية (JPG, PNG أو PDF)", "Upload clear photos of the following documents (JPG, PNG, or PDF)")}</p>
          <FileUploadRow label={tr("صورة هوية الأب", "Father's ID copy")} status={files.fatherId?.status} fileName={files.fatherId?.name} error={files.fatherId?.error} onSelect={(file) => uploadFile("fatherId", file)} />
          <FileUploadRow label={tr("صورة هوية الأم", "Mother's ID copy")} status={files.motherId?.status} fileName={files.motherId?.name} error={files.motherId?.error} onSelect={(file) => uploadFile("motherId", file)} />
          <FileUploadRow label={tr("صورة هوية الطفل (إن وجدت)", "Child's ID copy (if issued)")} status={files.childId?.status} fileName={files.childId?.name} error={files.childId?.error} onSelect={(file) => uploadFile("childId", file)} />
          <FileUploadRow label={tr("صورة شخصية للطفل", "Child's personal photo")} status={files.childPhoto?.status} fileName={files.childPhoto?.name} error={files.childPhoto?.error} onSelect={(file) => uploadFile("childPhoto", file)} />
          <div className="h-px bg-slate-100 my-1" />
          <FileUploadRow label={tr("كارت التطعيمات", "Vaccination card")} status={files.vaxCard?.status} fileName={files.vaxCard?.name} error={files.vaxCard?.error} onSelect={(file) => uploadFile("vaxCard", file)} />
          <button type="button" onClick={() => set("vaxPledge")(!f.vaxPledge)} className="w-full flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-3 gap-2">
            <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${f.vaxPledge ? "bg-amber-500 border-amber-500" : "border-amber-300"}`}>
              {f.vaxPledge && <Check className="w-3 h-3 text-white" />}
            </span>
            <span className="text-xs text-amber-700 leading-relaxed flex-1 text-right">{tr("كارت التطعيمات مش متاح دلوقتي — أتعهد بأن الطفل مكتمل التطعيمات وهقدم الكارت لاحقاً", "Vaccination card not available right now — I pledge the child is fully vaccinated and will provide the card later")}</span>
          </button>
        </>)}

        {step === 7 && (<>
          <SectionCard emoji="📜" title={tr("الشروط والأحكام", "Terms & conditions")} color="amber">
            <div className="max-h-56 overflow-y-auto bg-white rounded-2xl border border-amber-100 p-3 text-[11px] text-slate-600 leading-relaxed space-y-3">
              {TERMS.map((sec, si) => (
                <div key={si}>
                  <p className="font-extrabold text-slate-700 mb-1">{tr(sec.title.ar, sec.title.en)}</p>
                  {sec.items.map((it, ii) => (<p key={ii} className="mb-1.5">• {tr(it.ar, it.en)}</p>))}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 text-center">{tr("↕ اسحبي لقراءة كل الشروط", "↕ Scroll to read all the terms")}</p>
          </SectionCard>

          <SectionCard emoji="✅" title={tr("الإقرارات", "Declarations")} color="emerald">
            <button type="button" onClick={() => setF((s) => ({ ...s, consents: Object.fromEntries(CONSENTS.map((c) => [c.key, true])) }))}
              className="w-full text-xs font-bold text-emerald-700 bg-white border border-emerald-200 rounded-2xl py-2">
              {tr("✓ أوافق على كل الإقرارات (٦)", "✓ Accept all declarations (6)")}
            </button>
            {CONSENTS.map((c) => {
              const on = !!f.consents?.[c.key];
              return (
                <button key={c.key} type="button" onClick={() => setConsent(c.key, !on)}
                  className={`w-full flex items-start gap-2.5 text-right rounded-2xl border p-3 transition ${on ? "bg-white border-emerald-300" : "bg-white border-slate-200"}`}>
                  <span className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${on ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>
                    {on && <Check className="w-3.5 h-3.5 text-white" />}
                  </span>
                  <span className="text-[11.5px] leading-relaxed text-slate-700 flex-1">{tr(c.ar, c.en)}</span>
                </button>
              );
            })}
          </SectionCard>

          <SectionCard emoji="📸" title={tr("تصوير الطفل ونشر الصور", "Photos of your child")} color="pink">
            <p className="text-[11px] text-pink-700 text-right leading-relaxed">{tr("هل توافقين على تصوير طفلك ونشر صوره في أنشطة الحضانة ومنصاتها؟ (اختيارك لا يؤثر على قبول الطفل)", "Do you agree to photos/videos of your child being used in the nursery's activities and platforms? (Your choice does not affect admission.)")}</p>
            <YesNo label={tr("موافقة الوسائط", "Media consent")} value={f.media} onChange={set("media")} />
          </SectionCard>

          <SectionCard emoji="✍️" title={tr("التوقيع", "Signature")} color="sky">
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setF((s) => ({ ...s, sigName: s.fName || s.sigName, sigId: s.fId || s.sigId }))} className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-white border border-sky-200 text-sky-700">{tr("أنا الأب", "I'm the father")}</button>
              <button type="button" onClick={() => setF((s) => ({ ...s, sigName: s.mName || s.sigName, sigId: s.mId || s.sigId }))} className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-white border border-pink-200 text-pink-700">{tr("أنا الأم", "I'm the mother")}</button>
            </div>
            <Field req label={tr("اسم ولي الأمر الموقّع", "Signing parent's name")} value={f.sigName} onChange={setEv("sigName")} />
            <Field req label={tr("رقم الهوية الإماراتية", "Emirates ID number")} value={f.sigId} onChange={setEv("sigId")} inputMode="numeric" />
            <Field req label={tr("التاريخ", "Date")} type="date" value={f.sigDate} onChange={setEv("sigDate")} />
            <SignaturePad hasSignature={!!f.signatureDataUrl} onChange={(dataUrl) => set("signatureDataUrl")(dataUrl)} />
          </SectionCard>
        </>)}
      </div>

      <div className="p-4 pt-2 flex flex-col gap-1.5 bg-white border-t border-slate-100">
        {!stepValid() && (
          <p className="text-[11px] text-rose-500 font-bold text-center">{tr("املأي الخانات اللي عليها * علشان تكمّلي", "Please complete the fields marked * to continue")}</p>
        )}
        {step < steps.length - 1 ? (
          <button onClick={next} disabled={!stepValid()}
            className={`w-full font-extrabold py-3 rounded-2xl text-sm text-white transition ${stepValid() ? "bg-gradient-to-l from-orange-500 to-amber-400 shadow-md" : "bg-slate-300"}`}>
            {tr("التالي ←", "Next →")}
          </button>
        ) : (
          <button onClick={submit}
            disabled={!stepValid() || submitting || anyUploading}
            className={`w-full font-extrabold py-3 rounded-2xl text-sm text-white transition ${stepValid() && !submitting && !anyUploading ? "bg-gradient-to-l from-emerald-500 to-teal-400 shadow-md" : "bg-slate-300"}`}>
            {submitting ? tr("جارِ الإرسال...", "Submitting...") : anyUploading ? tr("جارِ رفع الملفات...", "Uploading files...") : tr("إرسال الاستمارة 🎉", "Submit form 🎉")}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------- Documents ----------------
function DocumentsScreen({ showToast }) {
  const { tr } = useLang();
  const [docs, setDocs] = useState([
    { key: "photos", label: tr("3 صور شخصية للطفل", "3 passport-size photos"), done: true },
    { key: "parentId", label: tr("صورة هوية الوالدين", "Parents' ID copy"), done: true },
    { key: "childId", label: tr("صورة هوية الطفل (إن وجدت)", "Child's ID copy (if issued)"), done: false },
    { key: "vax", label: tr("كارت تطعيمات الطفل", "Vaccination card"), done: false },
  ]);
  const upload = (i) => { setDocs((d) => d.map((x, idx) => (idx === i ? { ...x, done: true } : x))); showToast(tr("تم رفع المستند بنجاح", "Document uploaded successfully")); };
  return (
    <div className="px-4 py-4 space-y-3 overflow-y-auto h-full pb-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
        {docs.map((d, i) => (
          <div key={d.key} className="flex items-center justify-between p-4">
            <button onClick={() => upload(i)} disabled={d.done}
              className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 ${d.done ? "bg-emerald-50 text-emerald-500" : "bg-sky-500 text-white"}`}>
              {d.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
              {d.done ? tr("تم الرفع", "Uploaded") : tr("رفع الآن", "Upload now")}
            </button>
            <span className="text-sm text-slate-700 font-bold">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------- Complaints ----------------
function ComplaintsScreen({ showToast }) {
  const { tr } = useLang();
  const [tickets, setTickets] = useState([
    { id: 1, subject: tr("استفسار عن رسوم الباص", "Question about bus fees"), status: tr("تم الرد", "Replied"), reply: tr("رسوم الباص 250 د.إ شهرياً، شاملة الذهاب والعودة.", "Bus fees are AED 250/month, round trip included.") },
    { id: 2, subject: tr("طلب تغيير موعد استلام", "Pickup time change request"), status: tr("قيد المراجعة", "Under review"), reply: null },
  ]);
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState(null);
  const [subject, setSubject] = useState("");
  const [msg, setMsg] = useState("");

  const submit = () => {
    if (!subject || !msg) return;
    setTickets((t) => [{ id: Date.now(), subject, status: tr("قيد المراجعة", "Under review"), reply: null }, ...t]);
    setSubject(""); setMsg(""); setTopic(null); setOpen(false);
    showToast(tr("تم إرسال طلبك للإدارة", "Your request was sent to management"));
  };

  return (
    <div className="px-4 py-4 space-y-3 overflow-y-auto h-full pb-4">
      <button onClick={() => setOpen(true)} className="w-full bg-rose-500 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1">
        <Plus className="w-4 h-4" /> {tr("شكوى / استفسار جديد", "New inquiry / complaint")}
      </button>

      <div className="space-y-2">
        {tickets.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <StatusChip ok={t.status === tr("تم الرد", "Replied")} label={t.status} />
              <p className="text-sm font-bold text-slate-800">{t.subject}</p>
            </div>
            {t.reply && <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-lg p-2">{t.reply}</p>}
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-5 space-y-3 max-w-sm mx-auto">
            <div className="flex items-center justify-between">
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
              <p className="font-bold text-slate-800 text-sm">{tr("شكوى / استفسار جديد", "New inquiry / complaint")}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-end">
              {COMPLAINT_TOPICS.map((c) => {
                const s = split(c);
                return (
                  <button key={s.en} onClick={() => { setTopic(s.en); setSubject(tr(s.ar, s.en)); }}
                    className={`text-[11px] px-2.5 py-1.5 rounded-full border font-bold ${topic === s.en ? "bg-rose-500 text-white border-rose-500" : "bg-white text-slate-500 border-slate-200"}`}>
                    {tr(s.ar, s.en)}
                  </button>
                );
              })}
            </div>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={tr("الموضوع", "Subject")} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-right" />
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={tr("التفاصيل", "Details")} rows={3} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-right" />
            <button onClick={submit} className="w-full bg-rose-500 text-white font-bold py-2.5 rounded-xl text-sm">{tr("إرسال", "Send")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- More menu ----------------
function MoreMenu({ setMoreView }) {
  const { tr } = useLang();
  const items = [
    { key: "register", label: tr("تسجيل طفل إضافي (أخ/أخت)", "Register another child (sibling)"), icon: FileText, color: "text-sky-500" },
    { key: "documents", label: tr("المستندات المطلوبة", "Required documents"), icon: Upload, color: "text-teal-500" },
    { key: "complaints", label: tr("الشكاوى والاستفسارات", "Complaints & inquiries"), icon: MessageCircle, color: "text-rose-500" },
    { key: "branch", label: tr("معلومات الفرع", "Branch info"), icon: Building2, color: "text-purple-500" },
  ];
  return (
    <div className="px-4 py-4 space-y-2">
      {items.map((it) => (
        <button key={it.key} onClick={() => setMoreView(it.key)} className="w-full flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <ChevronLeft className="w-4 h-4 text-slate-300" />
          <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
            {it.label}
            <it.icon className={`w-4 h-4 ${it.color}`} />
          </span>
        </button>
      ))}
    </div>
  );
}

// ---------------- Admin ----------------
const ADMIN_EMAIL = "smbkfamily@gmail.com";

function BranchPasswordsPanel({ tr, showToast }) {
  const [open, setOpen] = useState(false);
  const [passwords, setPasswords] = useState(null);
  const [edits, setEdits] = useState({});
  const [savingBranch, setSavingBranch] = useState(null);

  const load = async () => {
    const { data, error } = await supabase.functions.invoke("branch-admin", { body: { action: "admin_get_passwords" } });
    if (!error && !data?.error) setPasswords(data.passwords || []);
  };

  const toggle = () => {
    setOpen((v) => !v);
    if (!passwords) load();
  };

  const save = async (branch) => {
    const password = (edits[branch] || "").trim();
    if (password.length < 4) { showToast(tr("الباسورد لازم يكون 4 حروف على الأقل", "Password must be at least 4 characters")); return; }
    setSavingBranch(branch);
    const { data, error } = await supabase.functions.invoke("branch-admin", { body: { action: "admin_set_password", branch, password } });
    setSavingBranch(null);
    if (error || data?.error) { showToast(tr("حصل خطأ", "Something went wrong")); return; }
    showToast(tr("تم تحديث باسورد الفرع", "Branch password updated"));
    setEdits((e) => ({ ...e, [branch]: "" }));
    load();
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <button onClick={toggle} className="w-full flex items-center justify-between">
        <ChevronLeft className={`w-4 h-4 text-slate-300 transition ${open ? "-rotate-90" : ""}`} />
        <p className="text-sm font-bold text-slate-700">🔐 {tr("كلمات مرور الفروع", "Branch passwords")}</p>
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {!passwords && <p className="text-xs text-slate-400 text-center">{tr("جارِ التحميل...", "Loading...")}</p>}
          {passwords?.map((p) => {
            const branch = BRANCHES.find((b) => b.key === p.branch);
            return (
              <div key={p.branch} className="border-t border-slate-100 pt-3">
                <p className="text-xs font-bold text-slate-600 mb-1">{branch ? tr(branch.name.ar, branch.name.en) : p.branch}</p>
                <p className="text-[11px] text-slate-400 mb-1.5" dir="ltr">{tr("الحالي: ", "Current: ")}{p.password}</p>
                <div className="flex gap-2">
                  <input value={edits[p.branch] || ""} onChange={(e) => setEdits((s) => ({ ...s, [p.branch]: e.target.value }))}
                    placeholder={tr("باسورد جديد", "New password")}
                    className="flex-1 border border-slate-200 rounded-xl px-2.5 py-2 text-xs" />
                  <button onClick={() => save(p.branch)} disabled={savingBranch === p.branch}
                    className="bg-slate-800 text-white font-bold px-3 rounded-xl text-xs disabled:opacity-60">
                    {savingBranch === p.branch ? "..." : tr("حفظ", "Save")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdminScreen({ showToast, onLogout }) {
  const { tr } = useLang();
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("portal_registrations")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setRegs(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    setApprovingId(id);
    const { data, error } = await supabase.functions.invoke("approve-registration", { body: { registration_id: id } });
    setApprovingId(null);
    if (error) {
      showToast(tr("حصل خطأ أثناء الموافقة", "Something went wrong approving"));
      return;
    }
    if (data?.email_sent === false) {
      showToast(tr("تمت الموافقة، لكن لم يصل إيميل للأهل (لازم توثيق الدومين على Resend)", "Approved, but the parent email didn't send (verify a domain on Resend)"));
    } else {
      showToast(tr("تمت الموافقة وتم إرسال إيميل لولي الأمر", "Approved and emailed the parent"));
    }
    load();
  };

  const pending = regs.filter((r) => r.status === "pending");
  const others = regs.filter((r) => r.status !== "pending");

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 pt-5 pb-3 bg-white border-b border-slate-100">
        <button onClick={onLogout} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100">
          <LogOut className="w-4 h-4 text-slate-400" />
        </button>
        <p className="font-extrabold text-slate-800 text-sm">{tr("لوحة الإدارة", "Admin Dashboard")}</p>
        <span className="w-8" />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading && <p className="text-xs text-slate-400 text-center">{tr("جارِ التحميل...", "Loading...")}</p>}
        {!loading && pending.length === 0 && <p className="text-xs text-slate-400 text-center">{tr("لا توجد طلبات قيد المراجعة", "No pending requests")}</p>}
        {pending.map((r) => {
          const branch = BRANCHES.find((b) => b.key === r.branch);
          const billing = r.documents?.billing;
          const freqLabel = billing ? tr({ monthly: "شهري", weekly: "أسبوعي", daily: "يومي" }[billing.frequency] || billing.frequency, billing.frequency) : "";
          return (
            <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <StatusChip ok={false} label={tr("قيد المراجعة", "Pending")} />
                <p className="text-sm font-bold text-slate-800">{r.form_data?.name || tr("بدون اسم", "No name")}</p>
              </div>
              <p className="text-xs text-slate-500">{branch ? tr(branch.name.ar, branch.name.en) : r.branch}</p>
              <p className="text-xs text-slate-500" dir="ltr">{r.contact_email}</p>
              {billing && <p className="text-xs text-slate-500">{tr(`الرسوم: ${billing.recurring_fee} د.إ (${freqLabel})`, `Fee: AED ${billing.recurring_fee} (${freqLabel})`)}</p>}
              <button onClick={() => approve(r.id)} disabled={approvingId === r.id}
                className="w-full bg-emerald-500 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-60">
                {approvingId === r.id ? tr("جارِ الموافقة...", "Approving...") : tr("موافقة", "Approve")}
              </button>
            </div>
          );
        })}
        {others.length > 0 && (
          <>
            <p className="text-xs font-bold text-slate-400 pt-2">{tr("طلبات سابقة", "Past requests")}</p>
            {others.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex items-center justify-between">
                <StatusChip ok={r.status === "approved"} label={r.status === "approved" ? tr("مقبول", "Approved") : r.status} />
                <p className="text-xs font-bold text-slate-600">{r.form_data?.name || r.contact_email}</p>
              </div>
            ))}
          </>
        )}
        <BranchPasswordsPanel tr={tr} showToast={showToast} />
      </div>
    </div>
  );
}

function PendingApprovalScreen({ onLogout, stopped }) {
  const { tr } = useLang();
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center gap-3">
      <AlertCircle className="w-10 h-10 text-amber-500" />
      {stopped ? (
        <>
          <p className="font-bold text-slate-800 text-sm">{tr("تسجيل طفلك متوقف حالياً", "Your child's registration is currently withdrawn")}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{tr("تواصلي مع إدارة الفرع لو محتاجة تفعّلي الحساب تاني.", "Contact the branch if you'd like the account reactivated.")}</p>
        </>
      ) : (
        <>
          <p className="font-bold text-slate-800 text-sm">{tr("طلب التسجيل لسه قيد المراجعة", "Your registration is still under review")}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{tr("هتقدري تدخلي على حساب طفلك بعد ما الإدارة توافق على طلب التسجيل.", "You'll be able to access your child's account once management approves the registration.")}</p>
        </>
      )}
      <button onClick={onLogout} className="mt-3 text-xs font-bold text-sky-500 bg-sky-50 rounded-full px-4 py-2">{tr("تسجيل الخروج", "Log out")}</button>
    </div>
  );
}

// ---------------- App shell ----------------
export default function ParentPortalPrototype() {
  const [lang, setLang] = useState("ar");
  const tr = (ar, en) => (lang === "ar" ? ar : en);
  const [screen, setScreen] = useState("landing");
  const [activeTab, setActiveTab] = useState("home");
  const [moreView, setMoreView] = useState(null);
  const [toast, setToast] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState("checking"); // checking | approved | pending
  const [myRegistrationId, setMyRegistrationId] = useState(null);
  const [branchSession, setBranchSession] = useState(null);
  const showToast = (t) => { setToast(t); setTimeout(() => setToast(""), 2400); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { setScreen("app"); setUserEmail(data.session.user.email); }
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) { setScreen("app"); setUserEmail(session.user.email); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Being logged in isn't enough — a parent only sees real content once one
  // of their registrations has been approved by the admin, and loses access
  // again if the branch marks the child as withdrawn ("stopped").
  useEffect(() => {
    if (!userEmail || userEmail === ADMIN_EMAIL) return;
    setApprovalStatus("checking");
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) { setApprovalStatus("pending"); return; }
      supabase
        .from("portal_registrations")
        .select("id, status")
        .eq("parent_user_id", uid)
        .then(({ data: rows, error }) => {
          const approvedRow = !error && rows ? rows.find((r) => r.status === "approved") : null;
          const stoppedRow = !error && rows ? rows.find((r) => r.status === "stopped") : null;
          setApprovalStatus(approvedRow ? "approved" : stoppedRow ? "stopped" : "pending");
          setMyRegistrationId(approvedRow ? approvedRow.id : null);
        });
    });
  }, [userEmail]);

  const logout = async () => {
    await supabase.auth.signOut();
    setScreen("landing");
    setActiveTab("home");
    setMoreView(null);
  };

  const tabs = [
    { key: "home", label: tr("الرئيسية", "Home"), icon: Home },
    { key: "schedule", label: tr("المواعيد", "Schedule"), icon: CalendarDays },
    { key: "reports", label: tr("التقرير", "Report"), icon: ClipboardList },
    { key: "fees", label: tr("الرسوم", "Fees"), icon: Wallet },
    { key: "more", label: tr("المزيد", "More"), icon: MoreHorizontal },
  ];
  const titles = {
    register: tr("استمارة تسجيل الطفل", "Child Registration Form"),
    documents: tr("المستندات المطلوبة", "Required Documents"),
    complaints: tr("الشكاوى والاستفسارات", "Complaints & Inquiries"),
    branch: tr("معلومات الفرع", "Branch Info"),
  };

  if (!authChecked) return null;

  return (
    <LangCtx.Provider value={{ lang, setLang, tr }}>
      <div dir={lang === "ar" ? "rtl" : "ltr"} className="w-full flex justify-center bg-slate-100 font-sans" style={{ minHeight: 700 }}>
        <div className="relative w-full max-w-sm bg-slate-50 rounded-[2rem] shadow-2xl overflow-hidden border-4 border-slate-800" style={{ height: 720 }}>

          {screen === "landing" && <Landing onNew={() => setScreen("newRegister")} onExisting={() => setScreen("login")} onBranchAdmin={() => setScreen("branchLogin")} />}

          {screen === "newRegister" && <RegisterForm standalone onBack={() => setScreen("landing")} showToast={showToast} />}

          {screen === "login" && <Login onBack={() => setScreen("landing")} />}

          {screen === "branchLogin" && (
            <BranchLogin tr={tr} onBack={() => setScreen("landing")} onLoggedIn={(session) => { setBranchSession(session); setScreen("branchAdmin"); }} />
          )}

          {screen === "branchAdmin" && branchSession && (
            <BranchAdminScreen tr={tr} session={branchSession} showToast={showToast} onLogout={() => { setBranchSession(null); setScreen("landing"); }} />
          )}

          {screen === "app" && userEmail === ADMIN_EMAIL && <AdminScreen showToast={showToast} onLogout={logout} />}

          {screen === "app" && userEmail && userEmail !== ADMIN_EMAIL && approvalStatus === "pending" && <PendingApprovalScreen onLogout={logout} />}

          {screen === "app" && userEmail && userEmail !== ADMIN_EMAIL && approvalStatus === "stopped" && <PendingApprovalScreen onLogout={logout} stopped />}

          {screen === "app" && userEmail && userEmail !== ADMIN_EMAIL && approvalStatus === "approved" && (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-4 pt-5 pb-3 bg-white border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <button onClick={logout} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100">
                    <LogOut className="w-4 h-4 text-slate-400" />
                  </button>
                  <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 relative">
                    <Bell className="w-4 h-4 text-slate-500" />
                    <span className="absolute top-1 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                  </button>
                </div>
                <p className="font-extrabold text-slate-800 text-sm">{tr("بوابة أولياء الأمور", "Parent Portal")}</p>
                <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="text-[11px] font-bold text-sky-500 bg-sky-50 rounded-full px-2.5 py-1 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {lang === "ar" ? "EN" : "AR"}
                </button>
              </div>

              <div className="flex-1 overflow-hidden">
                {activeTab === "home" && <HomeScreen setActiveTab={setActiveTab} setMoreView={setMoreView} goBranch={() => { setActiveTab("more"); setMoreView("branch"); }} />}
                {activeTab === "schedule" && <ScheduleScreen showToast={showToast} />}
                {activeTab === "reports" && <ReportsScreen registrationId={myRegistrationId} />}
                {activeTab === "fees" && <FeesScreen registrationId={myRegistrationId} />}
                {activeTab === "more" && !moreView && <MoreMenu setMoreView={setMoreView} />}
                {activeTab === "more" && moreView === "register" && <RegisterForm onBack={() => setMoreView(null)} showToast={showToast} />}
                {activeTab === "more" && moreView && moreView !== "register" && (
                  <div className="h-full flex flex-col">
                    <TopBar title={titles[moreView]} onBack={() => setMoreView(null)} />
                    <div className="flex-1 overflow-hidden">
                      {moreView === "documents" && <DocumentsScreen showToast={showToast} />}
                      {moreView === "complaints" && <ComplaintsScreen showToast={showToast} />}
                      {moreView === "branch" && <BranchScreen />}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-around bg-white border-t border-slate-100 py-2">
                {tabs.map((t) => {
                  const active = activeTab === t.key;
                  return (
                    <button key={t.key} onClick={() => { setActiveTab(t.key); setMoreView(null); }}
                      className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl ${active ? "text-sky-500" : "text-slate-400"}`}>
                      <t.icon className="w-5 h-5" />
                      <span className="text-[10px] font-bold">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <Toast text={toast} />
        </div>
      </div>
    </LangCtx.Provider>
  );
}
