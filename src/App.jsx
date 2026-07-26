import { useState, useEffect, useRef, createContext, useContext } from "react";
import {
  Home, CalendarDays, ClipboardList, Wallet, MoreHorizontal, ChevronLeft,
  Bell, LogOut, Upload, FileText, MessageCircle, CheckCircle2, Circle,
  Droplet, Moon, Smile, UtensilsCrossed, Plus, X, AlertCircle,
  Sparkles, Check, Globe, MapPin, Phone, Facebook, Instagram, ChevronRight,
  Building2
} from "lucide-react";
import { supabase } from "./lib/supabaseClient";

// ---------------- i18n ----------------
const LangCtx = createContext({ lang: "ar", tr: (a) => a });
const useLang = () => useContext(LangCtx);

// ---------------- data ----------------
const GROUP_WHATSAPP_CHANNEL = "whatsapp.com/channel/0029Vaa6ncZAYlUR5xH3YV2v";

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
const ONE_TIME_FEES = { registration: 300, stationery: 200, uniform: 315 };
const FREQUENCIES = [
  { key: "monthly", label: { ar: "شهري", en: "Monthly" } },
  { key: "weekly", label: { ar: "أسبوعي", en: "Weekly" } },
  { key: "daily", label: { ar: "يومي", en: "Daily" } },
];
const PLANS = [
  { key: "slot_8_11", label: { ar: "الاثنين - الخميس · ٨:٠٠ ص - ١١:٠٠ ص", en: "Mon-Thu · 8:00-11:00" }, monthly: 800, weekly: 250, daily: 60 },
  { key: "slot_11_3", label: { ar: "الاثنين - الخميس · ١١:٠٠ ص - ٣:٠٠ م", en: "Mon-Thu · 11:00-3:00" }, monthly: 1000, weekly: 350, daily: 80 },
  { key: "slot_8_1", label: { ar: "الاثنين - الخميس · ٨:٠٠ ص - ١:٠٠ م (+ساعة إضافية ١٠٠ د.إ)", en: "Mon-Thu · 8:00-1:00 (+AED100/extra hour)" }, monthly: 1100, weekly: 360, daily: 100 },
  { key: "slot_1_5", label: { ar: "الاثنين - الخميس · ١:٠٠ م - ٥:٠٠ م", en: "Mon-Thu · 1:00-5:00" }, monthly: 800, weekly: 250, daily: 80 },
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
function Field({ label, type = "text", value, onChange }) {
  const { lang } = useLang();
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 block mb-1" style={{ textAlign: lang === "ar" ? "right" : "left" }}>{label}</label>
      <input type={type} value={value || ""} onChange={onChange}
        style={{ textAlign: lang === "ar" ? "right" : "left" }}
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
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
function Select({ label, options, value, onChange, other, onOtherChange }) {
  const { lang, tr } = useLang();
  return (
    <div>
      <label className="text-xs font-bold text-slate-500 block mb-1" style={{ textAlign: lang === "ar" ? "right" : "left" }}>{label}</label>
      <div className="flex flex-wrap gap-1.5 justify-end" dir={lang === "ar" ? "rtl" : "ltr"}>
        {options.map((o) => {
          const { en, ar } = split(o);
          const val = en;
          const active = value === val;
          return (
            <button key={val} type="button" onClick={() => onChange(val)}
              className={`text-[11px] px-2.5 py-1.5 rounded-full border font-bold ${active ? "bg-sky-500 text-white border-sky-500" : "bg-white text-slate-500 border-slate-200"}`}>
              {tr(ar, en)}
            </button>
          );
        })}
      </div>
      {value === "Other" && (
        <input value={other || ""} onChange={onOtherChange} placeholder={tr("حددي...", "Please specify...")}
          style={{ textAlign: lang === "ar" ? "right" : "left" }}
          className="w-full mt-2 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
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
            className={`text-[11px] px-3 py-1.5 rounded-full border font-bold ${value === v ? "bg-sky-500 text-white border-sky-500" : "bg-white text-slate-500 border-slate-200"}`}>
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
function Landing({ onNew, onExisting }) {
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
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-sky-400" />
          {error && <p className="text-xs text-rose-500 font-bold mb-3">{error}</p>}
          <button onClick={sendLink} disabled={loading} className="w-full bg-sky-500 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-sky-600 transition disabled:opacity-60">
            {loading ? tr("جارِ الإرسال...", "Sending...") : tr("إرسال رابط الدخول", "Send login link")}
          </button>
        </div>
      ) : (
        <div className="w-full bg-white rounded-2xl p-5 shadow-xl text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm text-slate-700 font-bold mb-1">{tr("تم إرسال رابط الدخول", "Login link sent")}</p>
          <p className="text-xs text-slate-400">{tr("افتحي بريدك الإلكتروني واضغطي على الرابط للدخول تلقائياً", "Check your email and tap the link to sign in automatically")}</p>
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
function ReportsScreen() {
  const { tr } = useLang();
  const [day, setDay] = useState("today");
  const [noteIdx, setNoteIdx] = useState(0);
  const meals = [
    { m: tr("الفطار", "Breakfast"), ok: true },
    { m: tr("الغداء", "Lunch"), ok: true },
    { m: tr("سناك بعد الظهر", "Afternoon snack"), ok: false },
  ];
  const activities = [tr("رسم", "Drawing"), tr("موسيقى", "Music"), tr("لعب خارجي", "Outdoor play")];
  const note = split(QUICK_NOTES[noteIdx]);
  return (
    <div className="px-4 py-4 space-y-3 overflow-y-auto h-full pb-4">
      <div className="flex gap-2 justify-center">
        <button onClick={() => setDay("today")} className={`text-xs font-bold px-3 py-1.5 rounded-full ${day === "today" ? "bg-slate-800 text-white" : "bg-white text-slate-400 border border-slate-200"}`}>{tr("اليوم", "Today")}</button>
        <button onClick={() => setDay("yesterday")} className={`text-xs font-bold px-3 py-1.5 rounded-full ${day === "yesterday" ? "bg-slate-800 text-white" : "bg-white text-slate-400 border border-slate-200"}`}>{tr("أمس", "Yesterday")}</button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <p className="font-bold text-slate-800 text-sm mb-3">{tr("الوجبات", "Meals")}</p>
        <div className="space-y-2">
          {meals.map((r) => (
            <div key={r.m} className="flex items-center justify-between">
              <StatusChip ok={r.ok} label={r.ok ? tr("أكل الكل", "Ate all") : tr("أكل جزء", "Ate some")} />
              <span className="text-sm text-slate-600 font-bold">{r.m}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
          <Droplet className="w-5 h-5 mx-auto text-sky-500 mb-1" />
          <p className="text-lg font-extrabold text-slate-800">3</p>
          <p className="text-[11px] text-slate-400">{tr("أكواب ماء", "Cups of water")}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
          <Moon className="w-5 h-5 mx-auto text-indigo-500 mb-1" />
          <p className="text-lg font-extrabold text-slate-800">{tr("1:30 س", "1h 30m")}</p>
          <p className="text-[11px] text-slate-400">{tr("مدة القيلولة", "Nap duration")}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <Smile className="w-5 h-5 text-amber-500" />
          <p className="font-bold text-slate-800 text-sm">{tr("الحالة المزاجية والأنشطة", "Mood & activities")}</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {activities.map((a) => (<span key={a} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{a}</span>))}
        </div>
      </div>

      <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100 space-y-2">
        <p className="text-xs font-bold text-sky-600">{tr("ملاحظة المربية", "Teacher's note")}</p>
        <p className="text-xs text-slate-600 leading-relaxed bg-white rounded-lg p-2">{tr(note.ar, note.en)}</p>
      </div>
    </div>
  );
}

// ---------------- Fees ----------------
function FeesScreen({ showToast }) {
  const { tr } = useLang();
  const history = [
    { m: tr("يوليو 2026", "Jul 2026"), amount: "1,200", status: tr("مدفوع", "Paid"), date: "25/07" },
    { m: tr("يونيو 2026", "Jun 2026"), amount: "1,200", status: tr("مدفوع", "Paid"), date: "24/06" },
    { m: tr("مايو 2026", "May 2026"), amount: "1,200", status: tr("مدفوع", "Paid"), date: "26/05" },
  ];
  return (
    <div className="px-4 py-4 space-y-3 overflow-y-auto h-full pb-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-5 text-white">
        <p className="text-xs text-slate-300 mb-1">{tr("المستحق عن شهر أغسطس 2026", "Due for August 2026")}</p>
        <p className="text-2xl font-extrabold mb-3">{tr("1,200 د.إ", "AED 1,200")}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300">{tr("تاريخ الاستحقاق", "Due date")}</span>
          <span className="text-[11px] bg-amber-400/90 text-amber-900 font-bold px-2 py-1 rounded-full">{tr("مستحق يوم 27", "Due on the 27th")}</span>
        </div>
      </div>
      <button onClick={() => showToast(tr("سيتم تفعيل الدفع الإلكتروني قريباً", "Online payment will be enabled soon"))}
        className="w-full bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-sm">
        {tr("ادفع الآن", "Pay now")}
      </button>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <p className="font-bold text-slate-800 text-sm mb-3">{tr("سجل المدفوعات", "Payment history")}</p>
        <div className="space-y-2">
          {history.map((h) => (
            <div key={h.m} className="flex items-center justify-between text-xs border-b border-slate-50 pb-2 last:border-0">
              <span className="text-slate-700 font-bold">{h.m}</span>
              <span className="text-slate-600 font-bold">{tr(`${h.amount} د.إ`, `AED ${h.amount}`)}</span>
              <span className="text-slate-400">{h.date}</span>
              <span className="text-emerald-600 font-bold">{h.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- Register (multi-step, full form) ----------------
function RegisterForm({ onBack, showToast, standalone }) {
  const { tr } = useLang();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [regId] = useState(() => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`));
  const [files, setFiles] = useState({});
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const setEv = (k) => (e) => set(k)(e.target.value);
  const toggleSkill = (k) => setF((s) => ({ ...s, skills: { ...(s.skills || {}), [k]: !(s.skills || {})[k] } }));
  const setArrayItem = (key, idx, field) => (e) =>
    setF((s) => {
      const arr = [...(s[key] || [])];
      arr[idx] = { ...arr[idx], [field]: e.target.value };
      return { ...s, [key]: arr };
    });

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

  const steps = [
    tr("بيانات الطفل", "Child Info"),
    tr("بيانات الأب", "Father"),
    tr("بيانات الأم", "Mother"),
    tr("الإخوة والطوارئ", "Siblings & Emergency"),
    tr("الاستلام", "Pickup"),
    tr("الحالة الصحية", "Health"),
    tr("عن الطفل ومهاراته", "About & Skills"),
    tr("العادات والموافقة", "Habits & Consent"),
    tr("الخطة والرسوم", "Plan & Fees"),
    tr("المستندات المطلوبة", "Required Documents"),
    tr("الإقرار والتوقيع", "Acknowledgement"),
  ];

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => (step === 0 ? onBack() : setStep((s) => s - 1));

  const submit = async () => {
    setSubmitting(true);
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
    const oneTimeFee = ONE_TIME_FEES.registration + ONE_TIME_FEES.stationery + ONE_TIME_FEES.uniform;

    let signaturePath = null;
    if (f.signatureDataUrl) {
      const signatureBlob = await (await fetch(f.signatureDataUrl)).blob();
      const path = `${regId}/signature-${Date.now()}.png`;
      const { error: sigErr } = await supabase.storage.from("registration-documents").upload(path, signatureBlob, { contentType: "image/png" });
      if (!sigErr) signaturePath = path;
    }

    const { error } = await supabase.from("portal_registrations").insert({
      branch: selectedBranch?.key || f.branch || null,
      contact_email: contactEmail,
      parent_user_id: user?.id || null,
      form_data: f,
      documents: {
        father_id: files.fatherId?.path || null,
        mother_id: files.motherId?.path || null,
        child_id: files.childId?.path || null,
        child_photo: files.childPhoto?.path || null,
        vaccination_card: files.vaxCard?.path || null,
        vaccination_pledge: !!f.vaxPledge,
        signature: signaturePath,
        billing: {
          frequency: freq,
          plan_key: selectedPlan?.key || null,
          plan_label: selectedPlan?.label.en || null,
          transport_key: selectedTransport?.key || null,
          weekend_days: selectedWeekendDays.map((d) => d.key),
          recurring_fee: recurringFee,
          one_time_fee: oneTimeFee,
        },
      },
    });
    setSubmitting(false);
    if (error) {
      showToast(tr("حصل خطأ أثناء إرسال الاستمارة، حاولي مرة أخرى", "Something went wrong submitting the form, please try again"));
      return;
    }
    if (standalone) {
      showToast(tr("تم استلام طلبك! هتتراجع الإدارة عليه وتبعتلك رابط الدخول بعد الموافقة", "Application received! Management will review it and send your login link after approval"));
      setTimeout(onBack, 2600);
    } else {
      showToast(tr("تم إرسال استمارة التسجيل بنجاح", "Registration form submitted successfully"));
    }
  };

  return (
    <div className="h-full flex flex-col">
      <TopBar title={`${steps[step]} · ${step + 1}/${steps.length}`} onBack={back} />
      <StepDots step={step} total={steps.length} />
      <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-3">

        {step === 0 && (<>
          <Field label={tr("اسم الطفل رباعياً", "Child's full name")} value={f.name} onChange={setEv("name")} />
          <Field label={tr("اسم الشهرة / التدليل", "Nickname")} value={f.nick} onChange={setEv("nick")} />
          <Field label={tr("تاريخ الميلاد", "Date of birth")} type="date" value={f.dob} onChange={setEv("dob")} />
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {["boy", "girl"].map((v) => (
                <button key={v} onClick={() => set("gender")(v)} className={`text-[11px] px-3 py-1.5 rounded-full border font-bold ${f.gender === v ? "bg-sky-500 text-white border-sky-500" : "bg-white text-slate-500 border-slate-200"}`}>
                  {v === "boy" ? tr("ذكر", "Boy") : tr("أنثى", "Girl")}
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-slate-600">{tr("النوع", "Gender")}</span>
          </div>
          <Select label={tr("الجنسية", "Nationality")} options={NATIONALITIES} value={f.nat} onChange={set("nat")} other={f.natOther} onOtherChange={setEv("natOther")} />
          <Select label={tr("الديانة", "Religion")} options={RELIGIONS} value={f.religion} onChange={set("religion")} other={f.religionOther} onOtherChange={setEv("religionOther")} />
          <Select label={tr("اللغة الأولى للطفل", "Child's first language")} options={LANGUAGES} value={f.lang1} onChange={set("lang1")} other={f.lang1Other} onOtherChange={setEv("lang1Other")} />
          <Field label={tr("لغات أخرى في المنزل", "Other languages at home")} value={f.langOther} onChange={setEv("langOther")} />
          <Field label={tr("العنوان", "Address")} value={f.address} onChange={setEv("address")} />
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {["bus", "parent"].map((v) => (
                <button key={v} onClick={() => set("transport")(v)} className={`text-[11px] px-3 py-1.5 rounded-full border font-bold ${f.transport === v ? "bg-sky-500 text-white border-sky-500" : "bg-white text-slate-500 border-slate-200"}`}>
                  {v === "bus" ? tr("باص الحضانة", "Nursery bus") : tr("مع ولي الأمر", "With parent")}
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-slate-600">{tr("المواصلات", "Transport")}</span>
          </div>
          <Select label={tr("الفرع", "Branch")} options={BRANCHES.map((b) => `${b.name.en}|${b.name.ar}`)} value={f.branch} onChange={set("branch")} />
        </>)}

        {step === 1 && (<>
          <Field label={tr("اسم الأب", "Father's name")} value={f.fName} onChange={setEv("fName")} />
          <Select label={tr("الجنسية", "Nationality")} options={NATIONALITIES} value={f.fNat} onChange={set("fNat")} other={f.fNatOther} onOtherChange={setEv("fNatOther")} />
          <Select label={tr("اللغة الأولى", "First language")} options={LANGUAGES} value={f.fLang} onChange={set("fLang")} other={f.fLangOther} onOtherChange={setEv("fLangOther")} />
          <Field label={tr("رقم الهوية / الجواز", "Emirates ID / Passport")} value={f.fId} onChange={setEv("fId")} />
          <Field label={tr("الوظيفة وجهة العمل", "Occupation & company")} value={f.fJob} onChange={setEv("fJob")} />
          <Select label={tr("المدينة", "City")} options={CITIES} value={f.fCity} onChange={set("fCity")} other={f.fCityOther} onOtherChange={setEv("fCityOther")} />
          <Field label={tr("هاتف المنزل", "Home phone")} value={f.fHome} onChange={setEv("fHome")} />
          <Field label={tr("رقم الهاتف المتحرك", "Mobile number")} value={f.fMobile} onChange={setEv("fMobile")} />
          <Field label={tr("البريد الإلكتروني", "Email")} value={f.fEmail} onChange={setEv("fEmail")} />
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5 flex-wrap">
              {["married", "separated", "widowed"].map((v) => (
                <button key={v} onClick={() => set("marital")(v)} className={`text-[11px] px-3 py-1.5 rounded-full border font-bold ${f.marital === v ? "bg-sky-500 text-white border-sky-500" : "bg-white text-slate-500 border-slate-200"}`}>
                  {tr({ married: "متزوجان", separated: "منفصلان", widowed: "أرمل/أرملة" }[v], v[0].toUpperCase() + v.slice(1))}
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-slate-600">{tr("الحالة الاجتماعية", "Marital status")}</span>
          </div>
        </>)}

        {step === 2 && (<>
          <Field label={tr("اسم الأم", "Mother's name")} value={f.mName} onChange={setEv("mName")} />
          <Select label={tr("الجنسية", "Nationality")} options={NATIONALITIES} value={f.mNat} onChange={set("mNat")} other={f.mNatOther} onOtherChange={setEv("mNatOther")} />
          <Select label={tr("اللغة الأولى", "First language")} options={LANGUAGES} value={f.mLang} onChange={set("mLang")} other={f.mLangOther} onOtherChange={setEv("mLangOther")} />
          <Field label={tr("رقم الهوية / الجواز", "Emirates ID / Passport")} value={f.mId} onChange={setEv("mId")} />
          <Field label={tr("الوظيفة وجهة العمل", "Occupation & company")} value={f.mJob} onChange={setEv("mJob")} />
          <Select label={tr("المدينة", "City")} options={CITIES} value={f.mCity} onChange={set("mCity")} other={f.mCityOther} onOtherChange={setEv("mCityOther")} />
          <Field label={tr("هاتف المنزل", "Home phone")} value={f.mHome} onChange={setEv("mHome")} />
          <Field label={tr("رقم الهاتف المتحرك", "Mobile number")} value={f.mMobile} onChange={setEv("mMobile")} />
          <Field label={tr("البريد الإلكتروني", "Email")} value={f.mEmail} onChange={setEv("mEmail")} />
          <Field label={tr("الحاضن الشرعي (إن انفصلا)", "Legal guardian (if separated)")} value={f.guardian} onChange={setEv("guardian")} />
        </>)}

        {step === 3 && (<>
          <p className="text-xs font-bold text-slate-500">{tr("تفاصيل الإخوة (إن وجدوا)", "Siblings (if any)")}</p>
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid grid-cols-3 gap-1.5">
              <input placeholder={tr("الاسم", "Name")} value={f.siblings?.[i]?.name || ""} onChange={setArrayItem("siblings", i, "name")} className="border border-slate-200 rounded-lg px-2 py-2 text-xs" />
              <input placeholder={tr("الميلاد", "DOB")} value={f.siblings?.[i]?.dob || ""} onChange={setArrayItem("siblings", i, "dob")} className="border border-slate-200 rounded-lg px-2 py-2 text-xs" />
              <input placeholder={tr("المدرسة", "School")} value={f.siblings?.[i]?.school || ""} onChange={setArrayItem("siblings", i, "school")} className="border border-slate-200 rounded-lg px-2 py-2 text-xs" />
            </div>
          ))}
          <div className="h-px bg-slate-100 my-1" />
          <p className="text-xs font-bold text-slate-500">{tr("جهة اتصال إضافية للطوارئ", "Additional emergency contact")}</p>
          <Field label={tr("الاسم", "Name")} value={f.emName} onChange={setEv("emName")} />
          <Field label={tr("صلة القرابة", "Relationship")} value={f.emRel} onChange={setEv("emRel")} />
          <Field label={tr("رقم الجوال", "Mobile number")} value={f.emMobile} onChange={setEv("emMobile")} />
          <Field label={tr("هاتف المنزل / العمل", "Home / work number")} value={f.emHome} onChange={setEv("emHome")} />
        </>)}

        {step === 4 && (<>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-700">
            {tr("⚠ لن يُسلَّم الطفل إلا لشخص مذكور هنا، مع إبراز الهوية عند الاستلام.", "⚠ The child will only be released to someone listed here, with ID shown at pickup.")}
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-xl p-3 space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400">{tr(`الشخص ${i + 1}`, `Person ${i + 1}`)}</p>
              <input placeholder={tr("الاسم", "Name")} value={f.pickupPersons?.[i]?.name || ""} onChange={setArrayItem("pickupPersons", i, "name")} className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs" />
              <div className="grid grid-cols-2 gap-1.5">
                <input placeholder={tr("صلة القرابة", "Relationship")} value={f.pickupPersons?.[i]?.relation || ""} onChange={setArrayItem("pickupPersons", i, "relation")} className="border border-slate-200 rounded-lg px-2 py-2 text-xs" />
                <input placeholder={tr("رقم الهاتف", "Phone")} value={f.pickupPersons?.[i]?.phone || ""} onChange={setArrayItem("pickupPersons", i, "phone")} className="border border-slate-200 rounded-lg px-2 py-2 text-xs" />
              </div>
              <input placeholder={tr("رقم الهوية", "ID number")} value={f.pickupPersons?.[i]?.idNumber || ""} onChange={setArrayItem("pickupPersons", i, "idNumber")} className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs" />
            </div>
          ))}
        </>)}

        {step === 5 && (<>
          <YesNo label={tr("مرض مزمن؟", "Chronic illness?")} value={f.illness} onChange={set("illness")} />
          {f.illness === "yes" && <Field label={tr("التفاصيل", "Details")} value={f.illnessDetail} onChange={setEv("illnessDetail")} />}
          <YesNo label={tr("أدوية منتظمة؟", "Regular medication?")} value={f.meds} onChange={set("meds")} />
          {f.meds === "yes" && <Field label={tr("اسم الدواء والجرعة", "Medication & dosage")} value={f.medsDetail} onChange={setEv("medsDetail")} />}
          <YesNo label={tr("حساسية أطعمة/أدوية؟", "Food/medication allergy?")} value={f.allergy} onChange={set("allergy")} />
          {f.allergy === "yes" && <Field label={tr("التفاصيل والإجراء", "Details & response")} value={f.allergyDetail} onChange={setEv("allergyDetail")} />}
          <Select label={tr("فصيلة الدم", "Blood type")} options={BLOOD} value={f.blood} onChange={set("blood")} />
          <YesNo label={tr("التطعيمات مكتملة؟", "Vaccinations up to date?")} value={f.vax} onChange={set("vax")} />
          <YesNo label={tr("نظارة / سماعة؟", "Glasses / hearing aid?")} value={f.glasses} onChange={set("glasses")} />
          <YesNo label={tr("مشكلة سمع أو نظر؟", "Hearing/vision problem?")} value={f.hearing} onChange={set("hearing")} />
          <Field label={tr("طبيب الطفل وهاتفه", "Child's doctor & phone")} value={f.doctor} onChange={setEv("doctor")} />
        </>)}

        {step === 6 && (<>
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5 flex-wrap">
              {["eldest", "middle", "youngest"].map((v) => (
                <button key={v} onClick={() => set("order")(v)} className={`text-[11px] px-3 py-1.5 rounded-full border font-bold ${f.order === v ? "bg-sky-500 text-white border-sky-500" : "bg-white text-slate-500 border-slate-200"}`}>
                  {tr({ eldest: "الأكبر", middle: "الأوسط", youngest: "الأصغر" }[v], v[0].toUpperCase() + v.slice(1))}
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-slate-600">{tr("ترتيبه بين إخوته", "Birth order")}</span>
          </div>
          <Field label={tr("الهوايات / الألعاب المفضلة", "Hobbies / favorite toys")} value={f.hobbies} onChange={setEv("hobbies")} />
          <Field label={tr("الألوان المفضلة", "Favorite colors")} value={f.colors} onChange={setEv("colors")} />
          <Select label={tr("شخصية الطفل", "Personality")} options={PERSONALITY} value={f.personality} onChange={set("personality")} />
          <Field label={tr("أكثر شيء يحبه", "What they love most")} value={f.loves} onChange={setEv("loves")} />
          <Field label={tr("أكثر شيء يخيفه", "What they fear most")} value={f.fears} onChange={setEv("fears")} />
          <div className="h-px bg-slate-100 my-1" />
          <p className="text-xs font-bold text-slate-500">{tr("مهارات الطفل", "Child's skills")}</p>
          {SKILLS.map((s) => { const { en, ar } = split(s); return <CheckRow key={en} label={tr(ar, en)} checked={!!(f.skills || {})[en]} onChange={() => toggleSkill(en)} />; })}
        </>)}

        {step === 7 && (<>
          <Field label={tr("عدد ساعات النوم يومياً", "Hours of sleep per day")} value={f.sleepHrs} onChange={setEv("sleepHrs")} />
          <YesNo label={tr("ينام بمفرده؟", "Sleeps alone?")} value={f.sleepAlone} onChange={set("sleepAlone")} />
          <Field label={tr("الأطعمة المفضلة", "Favorite foods")} value={f.foodLike} onChange={setEv("foodLike")} />
          <Field label={tr("الأطعمة الممنوعة", "Foods not allowed")} value={f.foodNo} onChange={setEv("foodNo")} />
          <YesNo label={tr("يستخدم لهاية/رضّاعة؟", "Uses pacifier/bottle?")} value={f.pacifier} onChange={set("pacifier")} />
          <div className="h-px bg-slate-100 my-1" />
          <div className="bg-pink-50 border border-pink-200 rounded-xl p-3 text-xs text-pink-700 leading-relaxed">
            {tr("موافقة الوسائط: قد تُلتقط صور/فيديوهات للطفل وتُستخدم من الحضانة في منشوراتها. ملكية المواد تعود للحضانة.", "Media consent: photos/videos of the child may be taken and used by the nursery in its publications. Ownership of the media belongs to the nursery.")}
          </div>
          <YesNo label={tr("موافقة استخدام الوسائط", "Media consent")} value={f.media} onChange={set("media")} />
        </>)}

        {step === 8 && (<>
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
          <div className="space-y-2">
            {PLANS.map((p) => {
              const freq = f.frequency || "monthly";
              return (
                <button key={p.key} type="button" onClick={() => set("plan")(p.key)}
                  className={`w-full flex items-center justify-between rounded-xl border p-3 text-right ${f.plan === p.key ? "bg-sky-50 border-sky-400" : "bg-white border-slate-200"}`}>
                  <span className="text-xs font-bold text-slate-800 shrink-0">{tr(`${p[freq]} د.إ`, `AED ${p[freq]}`)}</span>
                  <span className="text-xs font-bold text-slate-600">{tr(p.label.ar, p.label.en)}</span>
                </button>
              );
            })}
          </div>

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
            const oneTimeTotal = ONE_TIME_FEES.registration + ONE_TIME_FEES.stationery + ONE_TIME_FEES.uniform;
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
                    <span className="font-bold">{tr(`${oneTimeTotal} د.إ`, `AED ${oneTimeTotal}`)}</span>
                    <span className="text-slate-300">{tr("رسوم لمرة واحدة (تسجيل + قرطاسية + زي)", "One-time fees (registration + stationery + uniform)")}</span>
                  </div>
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

        {step === 9 && (<>
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

        {step === 10 && (<>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-64 overflow-y-auto text-[11px] text-slate-600 leading-relaxed space-y-2">
            <p>{tr(
              "1. تُسدد الرسوم الشهرية مقدماً في موعد أقصاه يوم 27 من الشهر السابق لشهر الدراسة؛ ويحق للحضانة عدم قبول الطفل اعتباراً من اليوم الأول من الشهر الجديد حتى استكمال السداد، دون أي مسؤولية عليها عن ذلك.",
              "1. Monthly fees are paid in advance, no later than the 27th of the month before the study month; the nursery may refuse to admit the child from the 1st of the new month until payment is completed, without any liability."
            )}</p>
            <p>{tr(
              "2. الرسوم المدفوعة (التسجيل / الحجز / الشهرية / أي رسوم إدارية) غير قابلة للاسترداد أو التحويل مهما كانت الأسباب أو الظروف.",
              "2. Fees paid (registration / reservation / monthly / any administrative fees) are non-refundable and non-transferable for any reason or circumstance."
            )}</p>
            <p>{tr(
              "3. لا يحق استرداد الرسوم أو تخفيضها بسبب غياب الطفل أو مرضه.",
              "3. No refund or reduction of fees is due for the child's absence or illness."
            )}</p>
            <p>{tr(
              "4. تحتفظ إدارة الحضانة بحق إيقاف تسجيل أي طفل لا يلتزم بالقواعد، أو يظهر سلوكاً غير مقبول، أو يشكل خطراً على نفسه أو على الآخرين، على أن يتم إخطار ولي الأمر كتابياً قبل أسبوع واحد من الإيقاف.",
              "4. Management reserves the right to suspend the registration of any child who does not comply with the rules, shows unacceptable behavior, or poses a danger to themselves or others, with written notice to the parent one week before suspension."
            )}</p>
            <p>{tr(
              "5. يُرجى عدم إحضار الطفل للحضانة في حال مرضه، مع إبلاغ الإدارة بطبيعة المرض. وفي حال ظهرت على الطفل أعراض مرضية أثناء تواجده بالحضانة، سيتم إبلاغ ولي الأمر فوراً لاصطحابه خلال 30 دقيقة من الاتصال.",
              "5. Please do not bring the child to the nursery while ill, and inform management of the nature of the illness. If symptoms appear while at the nursery, the parent will be notified immediately to collect the child within 30 minutes of the call."
            )}</p>
            <p>{tr(
              "6. في حال وقوع إصابة أو حادث، يُبلَّغ ولي الأمر فوراً، وفي الحالات الطارئة يُنقل الطفل لأقرب مركز طبي أو مستشفى لتلقي الرعاية اللازمة، دون أن تتحمل الحضانة أي مسؤولية عن مضاعفات ناتجة عن حالة صحية لم يُفصح عنها ولي الأمر.",
              "6. In case of injury or accident, the parent is notified immediately, and in emergencies the child is transferred to the nearest medical center or hospital, without the nursery bearing responsibility for complications resulting from an undisclosed health condition."
            )}</p>
            <p>{tr(
              "7. يلتزم ولي الأمر بإبلاغ الحضانة مسبقاً بأي حساسية أو نظام غذائي خاص بالطفل.",
              "7. The parent must inform the nursery in advance of any allergy or special dietary requirements."
            )}</p>
            <p>{tr(
              "8. يُتوقع من ولي الأمر التواصل باحترام وتعاون مع طاقم الحضانة، والالتزام بسياساتها وإجراءاتها المعتمدة.",
              "8. The parent is expected to communicate respectfully and cooperatively with staff, and comply with the nursery's approved policies and procedures."
            )}</p>
            <p>{tr(
              "9. يجب حضور الطفل بالزي الموحد المعتمد من الحضانة، مع إحضار طقم ملابس إضافي ووجبة خفيفة وزجاجة ماء.",
              "9. The child must attend in the nursery's approved uniform, with an extra set of clothes, a snack, and a water bottle."
            )}</p>
            <p>{tr(
              "10. لا تتحمل الحضانة مسؤولية فقد أو تلف أي مقتنيات ثمينة يحضرها الطفل معه، ويُنصح بكتابة اسم الطفل على أغراضه الشخصية.",
              "10. The nursery is not responsible for loss or damage of valuable items brought by the child; it's recommended to label the child's belongings with their name."
            )}</p>
            <p>{tr(
              "11. تُطبَّق رسوم تأخير قدرها 20 درهماً عن كل ساعة تأخير في اصطحاب الطفل بعد موعد الانصراف الرسمي، وكذلك في حال التسليم المبكر خارج المواعيد الرسمية.",
              "11. A late fee of AED 20 applies per hour of delay picking up the child after official dismissal time, and also for early drop-off outside official hours."
            )}</p>
            <p>{tr(
              "12. يجب استكمال جميع المستندات المطلوبة (الصور الشخصية، صور الهويات، كارت التطعيمات) لإتمام إجراءات تسجيل الطفل.",
              "12. All required documents (personal photos, ID copies, vaccination card) must be completed to finalize registration."
            )}</p>
            <p>{tr(
              "13. في حال رغبة ولي الأمر بسحب الطفل، يجب تقديم إشعار كتابي مسبق للإدارة بمدة لا تقل عن شهر واحد؛ ولا يحق استرداد أي رسوم مدفوعة عن الفترة الجارية.",
              "13. To withdraw the child, the parent must give management at least one month's written notice; no fees paid for the current period will be refunded."
            )}</p>
            <p>{tr(
              "14. يفوّض ولي الأمر إدارة الحضانة باتخاذ الإجراءات الإسعافية الأولية اللازمة عند الضرورة القصوى، على أن يتم إبلاغه فوراً بذلك.",
              "14. The parent authorizes management to take necessary first-aid measures in extreme necessity, and will be notified immediately."
            )}</p>
            <p>{tr(
              "15. لن يُسلَّم الطفل إلا لولي الأمر أو لأحد الأشخاص المصرح لهم المذكورين في هذه الاستمارة، مع إبراز الهوية عند الاستلام.",
              "15. The child will only be released to the parent or an authorized person listed in this form, with ID shown at pickup."
            )}</p>
            <p>{tr(
              "16. يقر ولي الأمر بصحة واكتمال جميع البيانات الواردة في هذه الاستمارة، ويتحمل وحده المسؤولية الكاملة عن أي ضرر ينتج عن عدم الإفصاح عن معلومة جوهرية.",
              "16. The parent affirms the accuracy and completeness of all information in this form, and bears sole responsibility for any harm from failing to disclose material information."
            )}</p>
            <p>{tr(
              "17. بتسجيل طفلك في مجموعة رعاية الطفل للحضانات، فإنك تقر وتوافق على جميع القواعد والشروط الواردة في هذه الاستمارة، والمتوافقة مع اشتراطات هيئة الشارقة للتعليم الخاص (سبيا) ووزارة تنمية المجتمع.",
              "17. By registering your child with Child Care Nurseries Group, you acknowledge and agree to all rules and terms in this form, which comply with SPEA (Sharjah Private Education Authority) and Ministry of Community Development requirements."
            )}</p>
          </div>
          <button onClick={() => set("agree")(!f.agree)} className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3">
            <span className={`w-5 h-5 rounded border-2 flex items-center justify-center ${f.agree ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>
              {f.agree && <Check className="w-3.5 h-3.5 text-white" />}
            </span>
            <span className="text-xs font-bold text-slate-700">{tr("أوافق على جميع الشروط والأحكام", "I agree to all terms & conditions")}</span>
          </button>
          <Field label={tr("اسم ولي الأمر", "Parent name")} value={f.sigName} onChange={setEv("sigName")} />
          <Field label={tr("رقم الهوية الإماراتية", "Emirates ID number")} value={f.sigId} onChange={setEv("sigId")} />
          <Field label={tr("التاريخ", "Date")} type="date" value={f.sigDate} onChange={setEv("sigDate")} />
          <SignaturePad hasSignature={!!f.signatureDataUrl} onChange={(dataUrl) => set("signatureDataUrl")(dataUrl)} />
        </>)}
      </div>

      <div className="p-4 pt-2 flex gap-2">
        {step < steps.length - 1 ? (
          <button onClick={next} className="w-full bg-sky-500 text-white font-bold py-2.5 rounded-xl text-sm">{tr("التالي", "Next")}</button>
        ) : (
          <button onClick={submit}
            disabled={!f.agree || !f.signatureDataUrl || submitting || anyUploading}
            className={`w-full font-bold py-2.5 rounded-xl text-sm text-white ${f.agree && f.signatureDataUrl && !submitting && !anyUploading ? "bg-emerald-500" : "bg-slate-300"}`}>
            {submitting ? tr("جارِ الإرسال...", "Submitting...") : anyUploading ? tr("جارِ رفع الملفات...", "Uploading files...") : tr("إرسال الاستمارة", "Submit form")}
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
      </div>
    </div>
  );
}

function PendingApprovalScreen({ onLogout }) {
  const { tr } = useLang();
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center gap-3">
      <AlertCircle className="w-10 h-10 text-amber-500" />
      <p className="font-bold text-slate-800 text-sm">{tr("طلب التسجيل لسه قيد المراجعة", "Your registration is still under review")}</p>
      <p className="text-xs text-slate-400 leading-relaxed">{tr("هتقدري تدخلي على حساب طفلك بعد ما الإدارة توافق على طلب التسجيل.", "You'll be able to access your child's account once management approves the registration.")}</p>
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
  // of their registrations has been approved by the admin.
  useEffect(() => {
    if (!userEmail || userEmail === ADMIN_EMAIL) return;
    setApprovalStatus("checking");
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) { setApprovalStatus("pending"); return; }
      supabase
        .from("portal_registrations")
        .select("id")
        .eq("parent_user_id", uid)
        .eq("status", "approved")
        .limit(1)
        .then(({ data: rows, error }) => {
          setApprovalStatus(!error && rows && rows.length > 0 ? "approved" : "pending");
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

          {screen === "landing" && <Landing onNew={() => setScreen("newRegister")} onExisting={() => setScreen("login")} />}

          {screen === "newRegister" && <RegisterForm standalone onBack={() => setScreen("landing")} showToast={showToast} />}

          {screen === "login" && <Login onBack={() => setScreen("landing")} />}

          {screen === "app" && userEmail === ADMIN_EMAIL && <AdminScreen showToast={showToast} onLogout={logout} />}

          {screen === "app" && userEmail && userEmail !== ADMIN_EMAIL && approvalStatus === "pending" && <PendingApprovalScreen onLogout={logout} />}

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
                {activeTab === "reports" && <ReportsScreen />}
                {activeTab === "fees" && <FeesScreen showToast={showToast} />}
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
