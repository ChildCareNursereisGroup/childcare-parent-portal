// Developmental skills bank for the monthly evaluation.
// Staff pick one of five mastery levels per skill; the ready-made message is
// generated in the viewer's language (so parents reading in English see English).
// Only { skillId: level } is stored, never the generated text.

export const AGE_BANDS = [
  { id: "A", ar: "حتى 6 شهور", en: "0–6 months", minM: 0 },
  { id: "B", ar: "6 – 12 شهر", en: "6–12 months", minM: 6 },
  { id: "C", ar: "سنة – سنتين", en: "1–2 years", minM: 12 },
  { id: "D", ar: "2 – 3 سنوات", en: "2–3 years", minM: 24 },
  { id: "E", ar: "3 – 4 سنوات", en: "3–4 years", minM: 36 },
];

export function bandForMonths(months) {
  let id = "A";
  for (const b of AGE_BANDS) if (months >= b.minM) id = b.id;
  return id;
}

export function ageInMonths(dob, onDate = new Date()) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d)) return null;
  return (onDate.getFullYear() - d.getFullYear()) * 12 + (onDate.getMonth() - d.getMonth()) - (onDate.getDate() < d.getDate() ? 1 : 0);
}

export const DOMAINS = [
  { id: "lang", ar: "اللغة والتواصل", en: "Language & Communication", sub: { ar: "نطق • مفردات • قصص", en: "Speech • vocabulary • stories" }, icon: "🗣️" },
  { id: "motor_g", ar: "المهارات الحركية الكبيرة", en: "Gross Motor Skills", sub: { ar: "توازن • مشي • قفز", en: "Balance • walking • jumping" }, icon: "🏃" },
  { id: "motor_f", ar: "المهارات الحركية الدقيقة", en: "Fine Motor Skills", sub: { ar: "إمساك • رسم • قص", en: "Grip • drawing • cutting" }, icon: "✋" },
  { id: "social", ar: "التطور الاجتماعي والعاطفي", en: "Social & Emotional", sub: { ar: "مشاركة • تعاون • مشاعر", en: "Sharing • cooperation • emotions" }, icon: "❤️" },
  { id: "cognitive", ar: "التطور المعرفي", en: "Cognitive Development", sub: { ar: "تفكير • حل مشكلات • تصنيف", en: "Thinking • problem-solving • sorting" }, icon: "🧠" },
  { id: "selfcare", ar: "الاستقلالية والعناية الذاتية", en: "Independence & Self-care", sub: { ar: "نظافة • ترتيب • تناول طعام", en: "Hygiene • tidiness • eating" }, icon: "⭐" },
];

export const LEVELS = [
  { v: 5, ar: "متقن", en: "Mastered", color: "#10b981" },
  { v: 4, ar: "جيد جداً", en: "Very good", color: "#0ea5e9" },
  { v: 3, ar: "في تقدّم", en: "Progressing", color: "#f59e0b" },
  { v: 2, ar: "يحتاج دعم", en: "Needs support", color: "#f97316" },
  { v: 1, ar: "لم تبدأ بعد", en: "Not yet", color: "#f43f5e" },
];

// [arabic, english] per band → domain → 3 skills
const BANK = {
  A: {
    lang: [["الاستجابة للأصوات والكلام من حوله", "Responding to sounds and voices"], ["المناغاة وإصدار أصوات مثل «آه» و«أوه»", "Cooing and making sounds"], ["التواصل البصري أثناء الحديث معه", "Eye contact during interaction"]],
    motor_g: [["رفع الرأس أثناء الاستلقاء على البطن", "Lifting the head during tummy time"], ["التقلّب من البطن إلى الظهر", "Rolling over"], ["الجلوس بمساعدة مع ثبات الرأس", "Supported sitting with a steady head"]],
    motor_f: [["مسك الألعاب الصغيرة وتحريكها", "Holding and moving small toys"], ["مدّ اليد نحو الأشياء", "Reaching for objects"], ["نقل الشيء من يد إلى أخرى", "Passing an object between hands"]],
    social: [["الابتسام للوجوه المألوفة", "Smiling at familiar faces"], ["التهدّؤ عند الحمل والاحتضان", "Calming when held"], ["التعرّف على الوجوه المألوفة", "Recognising familiar people"]],
    cognitive: [["تتبّع الأشياء المتحركة بالعينين", "Following moving objects with the eyes"], ["الانتباه للألوان والألعاب الزاهية", "Attention to bright colours and toys"], ["استكشاف الأشياء بالفم واليدين", "Exploring objects with mouth and hands"]],
    selfcare: [["انتظام الرضاعة والنوم", "Settled feeding and sleep routine"], ["التفاعل أثناء الاستحمام وتغيير الملابس", "Cooperating during bathing and changing"], ["التأقلم مع المعلمة والحضانة", "Settling in with the teacher and nursery"]],
  },
  B: {
    lang: [["المناغاة بمقاطع مثل «با-دا-ما»", "Babbling syllables like “ba-da-ma”"], ["الاستجابة عند مناداته باسمه", "Responding to own name"], ["فهم كلمات بسيطة مثل «لا» و«تعال» و«باي»", "Understanding simple words (no, come, bye)"]],
    motor_g: [["الجلوس بدون مساعدة", "Sitting without support"], ["الزحف أو التنقّل من مكان لآخر", "Crawling or moving around"], ["الوقوف بالاستناد على الأثاث", "Standing while holding furniture"]],
    motor_f: [["الإمساك بالأشياء الصغيرة بالإبهام والسبابة", "Pincer grasp of small objects"], ["التصفيق باليدين", "Clapping hands"], ["إخراج الألعاب من الوعاء ووضعها فيه", "Taking toys out of and putting them into a container"]],
    social: [["التفاعل مع الأطفال الآخرين", "Interacting with other children"], ["الاستمتاع بألعاب «كوكو» والتفاعل معها", "Enjoying peek-a-boo games"], ["التعبير عن الفرح والانزعاج", "Showing joy and displeasure"]],
    cognitive: [["البحث عن الأشياء المخفية", "Looking for hidden objects"], ["تقليد الحركات البسيطة", "Imitating simple actions"], ["استكشاف الأشياء بالهزّ والطرق", "Exploring objects by shaking and banging"]],
    selfcare: [["الإمساك بالزجاجة أو الكوب", "Holding a bottle or cup"], ["تناول الأطعمة اللينة بأصابعه", "Finger-feeding soft foods"], ["التأقلم مع روتين الحضانة", "Adapting to the nursery routine"]],
  },
  C: {
    lang: [["نطق كلمات بسيطة بوضوح", "Saying simple words clearly"], ["الإشارة إلى الأشياء المألوفة وتسميتها", "Pointing to and naming familiar objects"], ["فهم التعليمات البسيطة", "Following simple instructions"]],
    motor_g: [["المشي باستقلالية", "Walking independently"], ["صعود الدرج بمساعدة", "Climbing stairs with help"], ["الركض ورمي الكرة", "Running and throwing a ball"]],
    motor_f: [["تكديس المكعّبات", "Stacking blocks"], ["الخربشة بالأقلام", "Scribbling with crayons"], ["تقليب صفحات الكتاب", "Turning book pages"]],
    social: [["اللعب بجانب الأطفال الآخرين", "Playing alongside other children"], ["تقليد الكبار في أنشطتهم", "Imitating adults' activities"], ["التعبير عن احتياجاته بالكلمات أو الإشارة", "Expressing needs with words or gestures"]],
    cognitive: [["اللعب التمثيلي البسيط", "Simple pretend play"], ["مطابقة الأشياء المتشابهة", "Matching similar objects"], ["تركيب الأشكال في الألغاز البسيطة", "Fitting shapes into simple puzzles"]],
    selfcare: [["محاولة الأكل بالملعقة", "Trying to eat with a spoon"], ["التعاون أثناء ارتداء الملابس", "Helping when getting dressed"], ["المساعدة في ترتيب الألعاب", "Helping to tidy toys"]],
  },
  D: {
    lang: [["تكوين جمل من 3 – 4 كلمات", "Making 3–4 word sentences"], ["التعبير عن احتياجاته بالكلام", "Expressing needs in words"], ["ترديد الأناشيد والقصص القصيرة", "Repeating songs and short stories"]],
    motor_g: [["القفز بالقدمين والتوازن", "Jumping with both feet and balancing"], ["صعود الدرج وركل الكرة", "Climbing stairs and kicking a ball"], ["الركض بثبات والتسلّق", "Running steadily and climbing"]],
    motor_f: [["الإمساك بالقلم وتقليد الخطوط والدوائر", "Holding a crayon and copying lines and circles"], ["تركيب الخرز والمكعّبات الصغيرة", "Threading beads and small blocks"], ["اللعب بالصلصال وفتح الأغطية", "Playing with dough and opening lids"]],
    social: [["المشاركة والانتظار لدوره", "Sharing and waiting for a turn"], ["التعبير عن مشاعره بالكلمات", "Putting feelings into words"], ["اللعب التعاوني مع الأقران", "Cooperative play with peers"]],
    cognitive: [["التعرّف على الألوان الأساسية", "Recognising basic colours"], ["العدّ حتى 5 وفهم «واحد» و«كثير»", "Counting to 5 and understanding one/many"], ["تصنيف الأشياء حسب اللون أو الحجم", "Sorting by colour or size"]],
    selfcare: [["التدريب على استخدام الحمام", "Toilet training"], ["غسل اليدين بمساعدة", "Washing hands with help"], ["الأكل بمفرده بالملعقة", "Eating independently with a spoon"]],
  },
  E: {
    lang: [["التحدّث بجمل واضحة وسرد حدث بسيط", "Speaking in clear sentences and retelling a simple event"], ["التعرّف على الأحرف وأصواتها", "Recognising letters and their sounds"], ["الاستماع للقصة والإجابة عن أسئلتها", "Listening to a story and answering questions"]],
    motor_g: [["القفز على قدم واحدة والتوازن", "Hopping on one foot and balancing"], ["ركوب الدراجة ثلاثية العجلات واللعب بالكرة", "Riding a tricycle and playing ball"], ["التسلّق بثقة على ألعاب الحضانة", "Climbing playground equipment confidently"]],
    motor_f: [["الإمساك بالقلم بشكل صحيح", "Holding a pencil correctly"], ["القصّ بالمقص", "Cutting with scissors"], ["رسم الأشكال والتلوين داخل الحدود", "Drawing shapes and colouring within the lines"]],
    social: [["اللعب الجماعي واتباع القواعد", "Group play and following rules"], ["التعاطف ومساعدة الآخرين", "Showing empathy and helping others"], ["الانفصال عن الأهل بسهولة", "Separating from parents easily"]],
    cognitive: [["العدّ حتى 10 ومعرفة الأرقام", "Counting to 10 and knowing numbers"], ["معرفة الأشكال والمقارنات (كبير/صغير)", "Knowing shapes and comparisons (big/small)"], ["حلّ الألغاز وتسلسل الأنشطة", "Solving puzzles and sequencing activities"]],
    selfcare: [["استخدام الحمام باستقلالية", "Using the toilet independently"], ["ارتداء الملابس والحذاء بمفرده", "Dressing and putting on shoes alone"], ["ترتيب أغراضه وغسل يديه", "Tidying belongings and washing hands"]],
  },
};

export function skillsFor(band) {
  const out = {};
  for (const d of DOMAINS) {
    out[d.id] = (BANK[band]?.[d.id] || []).map((s, i) => ({ id: `${band}.${d.id}.${i + 1}`, ar: s[0], en: s[1] }));
  }
  return out;
}

// Every skill indexed by id (for parents' view, which can span bands).
const ALL = {};
for (const band of Object.keys(BANK)) {
  const sk = skillsFor(band);
  for (const d of DOMAINS) for (const s of sk[d.id]) ALL[s.id] = { ...s, domain: d.id, band };
}
export const skillById = (id) => ALL[id];

const TIPS = {
  ar: {
    lang: "ننصح بالحديث {معه|معها} والقراءة {له|لها} يومياً.",
    motor_g: "ننصح بإتاحة وقت للّعب الحركي والمشي في الحديقة.",
    motor_f: "ننصح بالألعاب الصغيرة كالصلصال والخرز والتلوين.",
    social: "ننصح بإتاحة فرص اللعب مع الأطفال وتشجيع{ه|ها} على المشاركة.",
    cognitive: "ننصح بالألغاز وألعاب التصنيف والمطابقة.",
    selfcare: "ننصح بإعطائ{ه|ها} فرصة المحاولة بنفس{ه|ها}.",
  },
  en: {
    lang: "We recommend talking and reading together every day.",
    motor_g: "We recommend active play and walks outdoors.",
    motor_f: "We recommend small-hand play such as dough, beads and colouring.",
    social: "We recommend regular playtime with other children.",
    cognitive: "We recommend puzzles and sorting/matching games.",
    selfcare: "We recommend letting {him|her} try by {himself|herself}.",
  },
};

const TPL = {
  ar: {
    5: "🌟 ما شاء الله! {n} {أتقن|أتقنت} مهارة «{s}»، و{يؤديها|تؤديها} باستقلالية وثقة.",
    4: "⭐ {n} {يؤدي|تؤدي} مهارة «{s}» بشكل جيد جداً، و{يحتاج|تحتاج} فقط إلى لمسة تشجيع للوصول إلى الإتقان.",
    3: "👍 {n} في تقدّم مستمر في مهارة «{s}»، و{يؤديها|تؤديها} أحياناً {بمفرده|بمفردها} وأحياناً بمساعدة المعلمة.",
    2: "🌱 {n} {بدأ|بدأت} {يتعرّف|تتعرّف} على مهارة «{s}»، و{يحتاج|تحتاج} إلى مساعدة وتكرار للتدريب عليها. {tip}",
    1: "💛 لم تظهر مهارة «{s}» لدى {n} بعد، وهذا طبيعي فلكل طفل وتيرته الخاصة؛ وسنعمل على تهيئتها بأنشطة مبسّطة. {tip}",
  },
  en: {
    5: "🌟 MashaAllah! {n} has mastered «{s}» and does it independently and with confidence.",
    4: "⭐ {n} does «{s}» very well and only needs a little encouragement to master it.",
    3: "👍 {n} is making steady progress in «{s}» — {he|she} does it alone sometimes and with the teacher's help at other times.",
    2: "🌱 {n} is just starting to learn «{s}» and needs help and repetition to practise. {tip}",
    1: "💛 «{s}» hasn't appeared yet for {n}, which is perfectly normal — every child has their own pace. We'll introduce it with simple activities. {tip}",
  },
};

function gen(str, gender) {
  const f = gender === "girl";
  return str.replace(/\{([^{}|]+)\|([^{}|]+)\}/g, (_m, a, b) => (f ? b : a));
}

// message for a skill at a mastery level, in "ar" | "en"
export function messageFor({ skillId, level, name, gender, lang }) {
  const sk = skillById(skillId);
  if (!sk || !level) return "";
  const l = lang === "en" ? "en" : "ar";
  const nm = (name || "").trim().split(" ")[0] || (l === "ar" ? "الطفل" : "Your child");
  const tip = level <= 2 ? gen(TIPS[l][sk.domain] || "", gender) : "";
  const text = TPL[l][level].replace("{s}", sk[l]).replace("{n}", nm).replace("{tip}", tip);
  return gen(text, gender).replace(/\s+$/g, "");
}

export function domainAverage(ratings, domainId) {
  const vals = Object.entries(ratings || {})
    .filter(([id]) => skillById(id)?.domain === domainId)
    .map(([, v]) => v)
    .filter((v) => v > 0);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}
