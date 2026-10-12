// "English|Arabic" option lists used by the registration form, so stored English
// values can be shown in Arabic on the printed form. Mirrors the lists in App.jsx.
const PAIRS = [
  "Emirati|إماراتي", "Egyptian|مصري", "Indian|هندي", "Pakistani|باكستاني", "Filipino|فلبيني", "Syrian|سوري", "Jordanian|أردني", "British|بريطاني",
  "Muslim|مسلم", "Christian|مسيحي", "Hindu|هندوسي",
  "Arabic|العربية", "English|الإنجليزية", "Urdu/Hindi|الأردية/الهندية",
  "Sharjah|الشارقة", "Ajman|عجمان", "Dubai|دبي",
  "Unknown|لا يُعرف",
  "Calm|هادئ", "Social|اجتماعي", "Shy|خجول", "Very active|كثير الحركة", "A leader|قيادي",
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
  "yes|نعم", "no|لا",
  "boy|ذكر", "girl|أنثى",
  "married|متزوجان", "separated|منفصلان", "widowed|أرمل/أرملة",
  "only|الوحيد", "first|الأكبر", "middle|الأوسط", "last|الأصغر",
  "monthly|شهري", "weekly|أسبوعي", "daily|يومي",
  "bus|باص الحضانة", "parent|مع ولي الأمر",
];

const MAP = Object.fromEntries(PAIRS.map((p) => p.split("|")));

// Arabic for a stored value; falls back to the value itself (free text, "Other" text, numbers).
export const toAr = (v) => (v === undefined || v === null || v === "" ? "" : MAP[v] || String(v));

// "Other" selections store the typed text in <key>Other.
export const withOther = (v, other) => (v === "Other" ? other || "غير ذلك" : toAr(v));
