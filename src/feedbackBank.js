// Parent survey questions (quarterly, ~5 minutes) + complaint/feedback vocabularies.
// `ind` = the Sharjah review-framework indicator each section gives evidence for.

export const SURVEY_SECTIONS = [
  {
    id: "comm", icon: "💬", ind: "2.4 · 4.3",
    ar: "التواصل والشراكة مع الأهل", en: "Communication & partnership",
    q: [
      ["c1", "تتواصل معي الحضانة بشكل واضح ومحترم.", "The nursery communicates with me clearly and respectfully."],
      ["c2", "أحصل بانتظام على معلومات كافية عن طفلي.", "I regularly receive enough information about my child."],
      ["c3", "التقرير الشهري عن نمو طفلي واضح ومفيد.", "The monthly development report about my child is clear and useful."],
      ["c4", "أجد من يرد على استفساراتي بسرعة.", "My questions are answered quickly."],
      ["c5", "تؤخذ ملاحظاتي وشكاواي بجدية ويتم التعامل معها.", "My comments and complaints are taken seriously and dealt with."],
    ],
  },
  {
    id: "learn", icon: "🌱", ind: "1.1 · 2.2 · 2.3",
    ar: "التعلّم ونمو الطفل", en: "Learning & child's development",
    q: [
      ["l1", "طفلي يستمتع بالذهاب إلى الحضانة.", "My child enjoys going to nursery."],
      ["l2", "الأنشطة مناسبة لعمر طفلي.", "The activities suit my child's age."],
      ["l3", "ألاحظ تقدّماً حقيقياً في نمو طفلي.", "I see real progress in my child's development."],
      ["l4", "المعلمة تعرف احتياجات طفلي جيداً.", "The teacher knows my child's needs well."],
    ],
  },
  {
    id: "care", icon: "🛡️", ind: "3.1 · 3.2 · 3.3",
    ar: "الرعاية والأمان والصحة", en: "Care, safety & health",
    q: [
      ["s1", "أشعر أن طفلي في أمان وطمأنينة.", "I feel my child is safe and secure."],
      ["s2", "النظافة والتعقيم ممتازان.", "Cleanliness and hygiene are excellent."],
      ["s3", "الوجبات والوجبات الخفيفة صحية ومناسبة.", "Meals and snacks are healthy and suitable."],
      ["s4", "يتم إبلاغي فوراً عند أي حادث أو مرض.", "I am informed promptly about any accident or illness."],
    ],
  },
  {
    id: "ops", icon: "🏫", ind: "4.5 · 4.6",
    ar: "المبنى والتنظيم", en: "Building & organisation",
    q: [
      ["o1", "المبنى والساحات آمنة ومريحة.", "The building and play areas are safe and comfortable."],
      ["o2", "تنظيم الاستلام والتسليم جيد.", "Drop-off and pick-up are well organised."],
      ["o3", "الرسوم والفواتير واضحة.", "Fees and invoices are clear."],
    ],
  },
  {
    id: "culture", icon: "🇦🇪", ind: "2.6 · 4.1",
    ar: "اللغة العربية والهوية الإماراتية", en: "Arabic language & Emirati identity",
    q: [["u1", "تهتم الحضانة باللغة العربية والهوية والثقافة الإماراتية.", "The nursery gives good attention to Arabic and Emirati identity and culture."]],
  },
  {
    id: "overall", icon: "⭐", ind: "4.3",
    ar: "التقييم العام", en: "Overall",
    q: [["v1", "بشكل عام أنا راضٍ عن الحضانة.", "Overall, I am satisfied with the nursery."]],
  },
];

export const SURVEY_QUESTIONS = SURVEY_SECTIONS.flatMap((s) => s.q.map(([id, ar, en]) => ({ id, ar, en, section: s.id })));
export const surveyQuestionById = Object.fromEntries(SURVEY_QUESTIONS.map((q) => [q.id, q]));

export const RATING_FACES = [
  { v: 1, e: "😞", ar: "غير راضٍ", en: "Very unhappy", color: "#ef4444" },
  { v: 2, e: "😕", ar: "غير راضٍ نسبياً", en: "Unhappy", color: "#f97316" },
  { v: 3, e: "😐", ar: "مقبول", en: "Okay", color: "#eab308" },
  { v: 4, e: "🙂", ar: "راضٍ", en: "Happy", color: "#22c55e" },
  { v: 5, e: "😍", ar: "راضٍ جداً", en: "Very happy", color: "#059669" },
];

export const CASE_KINDS = [
  { id: "complaint", ar: "شكوى", en: "Complaint", icon: "⚠️" },
  { id: "suggestion", ar: "اقتراح", en: "Suggestion", icon: "💡" },
  { id: "compliment", ar: "شكر", en: "Compliment", icon: "💛" },
];

export const CASE_CATEGORIES = [
  { id: "care", ar: "الرعاية", en: "Care" },
  { id: "health", ar: "الصحة", en: "Health" },
  { id: "safety", ar: "الأمان", en: "Safety" },
  { id: "communication", ar: "التواصل", en: "Communication" },
  { id: "fees", ar: "الرسوم", en: "Fees" },
  { id: "staff", ar: "سلوك موظفة", en: "Staff conduct", sensitive: true },
  { id: "protection", ar: "حماية الطفل", en: "Child protection", sensitive: true },
  { id: "facilities", ar: "المبنى والمرافق", en: "Facilities" },
  { id: "learning", ar: "التعلّم والأنشطة", en: "Learning & activities" },
  { id: "other", ar: "أخرى", en: "Other" },
];

export const CASE_STATUSES = [
  { id: "new", ar: "جديدة", en: "New", color: "#ef4444" },
  { id: "review", ar: "قيد المراجعة", en: "Under review", color: "#f59e0b" },
  { id: "action", ar: "تم اتخاذ إجراء", en: "Action taken", color: "#0ea5e9" },
  { id: "resolved", ar: "تم الحل", en: "Resolved", color: "#10b981" },
];

export const CASE_SOURCES = [
  { id: "portal", ar: "البوابة", en: "Portal" },
  { id: "phone", ar: "تليفون", en: "Phone" },
  { id: "whatsapp", ar: "واتساب", en: "WhatsApp" },
  { id: "in_person", ar: "شخصياً", en: "In person" },
  { id: "other", ar: "أخرى", en: "Other" },
];

export const kindOf = (id) => CASE_KINDS.find((k) => k.id === id) || CASE_KINDS[0];
export const categoryOf = (id) => CASE_CATEGORIES.find((c) => c.id === id) || CASE_CATEGORIES[CASE_CATEGORIES.length - 1];
export const statusOf = (id) => CASE_STATUSES.find((s) => s.id === id) || CASE_STATUSES[0];
export const sourceOf = (id) => CASE_SOURCES.find((s) => s.id === id) || CASE_SOURCES[CASE_SOURCES.length - 1];

// Targets used to colour the monthly report KPIs (managers can change them here).
export const TARGETS = { response: 50, satisfaction: 85, nps: 30, ackHours: 24, resolveDays: 5, resolveRate: 90, reportsSent: 95 };
