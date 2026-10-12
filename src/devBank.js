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

const TPL = {
  ar: {
    5: "🌟 ما شاء الله! {n} {أتقن|أتقنت} مهارة «{s}»، و{يؤديها|تؤديها} باستقلالية وثقة.",
    4: "⭐ {n} {يؤدي|تؤدي} مهارة «{s}» بشكل جيد جداً، و{يحتاج|تحتاج} فقط إلى لمسة تشجيع للوصول إلى الإتقان.",
    3: "👍 {n} في تقدّم مستمر في مهارة «{s}»، و{يؤديها|تؤديها} أحياناً {بمفرده|بمفردها} وأحياناً بمساعدة المعلمة.",
    2: "🌱 {n} {بدأ|بدأت} {يتعرّف|تتعرّف} على مهارة «{s}»، و{يحتاج|تحتاج} إلى مساعدة وتكرار للتدريب عليها.",
    1: "💛 لم تظهر مهارة «{s}» لدى {n} بعد، وهذا طبيعي فلكل طفل وتيرته الخاصة؛ وسنعمل على تهيئتها بأنشطة مبسّطة.",
  },
  en: {
    5: "🌟 MashaAllah! {n} has mastered «{s}» and does it independently and with confidence.",
    4: "⭐ {n} does «{s}» very well and only needs a little encouragement to master it.",
    3: "👍 {n} is making steady progress in «{s}» — {he|she} does it alone sometimes and with the teacher's help at other times.",
    2: "🌱 {n} is just starting to learn «{s}» and needs help and repetition to practise.",
    1: "💛 «{s}» hasn't appeared yet for {n}, which is perfectly normal — every child has their own pace. We'll introduce it with simple activities.",
  },
};

function gen(str, gender) {
  const f = gender === "girl";
  return str.replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_m, a, b) => (f ? b : a));
}

// ---- Activities to support skills the child hasn't mastered yet (levels 1-2) ----
// Stage groups: baby = bands A-B (0-12m), toddler = C-D (1-3y), pre = E (3-4y).
const groupOf = (band) => (band === "A" || band === "B" ? "baby" : band === "E" ? "pre" : "toddler");

const ACTIVITIES = {
  parent: {
    lang: {
      baby: ["تحدّثوا مع {طفلكم|طفلتكم} كثيراً أثناء الاستحمام والأكل، وغنّوا {له|لها} الأغاني القصيرة وقلّدوا أصواته{|ا} بابتسامة.", "Talk and sing to your baby often during bath and feeding times, and copy the sounds {he|she} makes with a smile."],
      toddler: ["اقرؤوا قصة مصوّرة قصيرة كل ليلة، واسألوا {طفلكم|طفلتكم} «وين القطة؟» ثم كرّروا الكلمة بشكل صحيح وأضيفوا لها كلمة.", "Read a short picture book every night, ask \"Where is the cat?\", then repeat the word correctly and add one more word."],
      pre: ["شجّعوا {طفلكم|طفلتكم} على حكاية ما حدث في يومه{|ا} بجمل كاملة، والعبوا لعبة «أنا أرى...» لوصف الأشياء من حولكم.", "Encourage your child to tell you about the day in full sentences, and play \"I spy...\" to describe things around you."],
    },
    motor_g: {
      baby: ["ضعوا {طفلكم|طفلتكم} على بطنه{|ا} على سجادة آمنة عدة مرات يومياً، وضعوا لعبة ملوّنة أمامه{|ا} {ليحاول|لتحاول} الوصول إليها.", "Give your baby daily tummy time on a safe mat, with a colourful toy just out of reach to encourage reaching and crawling."],
      toddler: ["اخرجوا للحديقة يومياً: امشوا، اركضوا، اقفزوا، واركلوا الكرة مع {طفلكم|طفلتكم}، وساعدوه{|ا} على صعود الدرج {ممسكاً|ممسكة} بيدكم.", "Visit the park daily: walk, run, jump and kick a ball together, and help your child climb stairs holding your hand."],
      pre: ["العبوا ألعاب القفز على قدم واحدة والتوازن على خط مرسوم على الأرض ورمي الكرة واصطيادها لمدة 10 دقائق يومياً.", "Play hopping on one foot, balancing along a line on the floor and throwing/catching a ball for 10 minutes a day."],
    },
    motor_f: {
      baby: ["أعطوا {طفلكم|طفلتكم} ألعاباً آمنة {يمسكها ويهزّها وينقلها|تمسكها وتهزّها وتنقلها} من يد لأخرى، وشجّعوه{|ا} على الإمساك بقطع طعام ناعمة.", "Offer safe toys to grasp, shake and pass between hands, and let your baby pick up soft finger foods."],
      toddler: ["العبوا بالصلصال والخرز الكبير وبرج المكعبات، ودعوه{|ا} {يخربش|تخربش} بالألوان الشمعية الكبيرة على ورق كبير.", "Play with dough, large beads and block towers, and let your child scribble with chunky crayons on big paper."],
      pre: ["مارسوا القص بالمقص الآمن والتلوين داخل الخطوط وتشكيل الصلصال وفكّ وربط الأزرار لتقوية أصابعه{|ا}.", "Practise safe scissor cutting, colouring inside lines, dough shaping and buttoning to strengthen small hands."],
    },
    social: {
      baby: ["ابتسموا لـ{طفلكم|طفلتكم} وتبادلوا معه{|ا} النظرات واللعب بـ«بيك-أبو»، وعرّفوه{|ا} بأشخاص جدد بوجودكم.", "Smile, make eye contact and play peek-a-boo, and introduce new people while you stay close by."],
      toddler: ["رتّبوا مواعيد لعب قصيرة مع أطفال آخرين، وعلّموا {طفلكم|طفلتكم} كلمات «من فضلك» و«شكراً» وتبادل الأدوار في اللعب.", "Arrange short playdates with other children and practise saying \"please\" and \"thank you\" and taking turns."],
      pre: ["العبوا ألعاب الطاولة البسيطة التي تتطلب انتظار الدور، وتحدّثوا عن مشاعره{|ا} وكيف نتصرف حين نغضب أو نحزن.", "Play simple board games that need turn-taking, and talk about feelings and what to do when we are angry or sad."],
    },
    cognitive: {
      baby: ["أروا {طفلكم|طفلتكم} ألعاباً ملوّنة وحرّكوها ببطء {ليتابعها|لتتابعها} بعينيه{|ا}، ثم أخفوها تحت قطعة قماش {ليبحث|لتبحث} عنها.", "Show colourful toys and move them slowly for your baby to follow, then hide one under a cloth for them to find."],
      toddler: ["قدّموا ألغاز القطع الكبيرة وألعاب تصنيف الألوان والأشكال، واطلبوا منه{|ا} {أن يضع|أن تضع} الأشياء في صناديق حسب لونها.", "Offer big-piece puzzles and colour/shape sorting games, and ask your child to sort objects into boxes by colour."],
      pre: ["العبوا ألعاب الذاكرة والمطابقة والعدّ بالأشياء اليومية (حبات فاكهة، ملاعق)، وتعرّفوا معاً على حرف أو رقم جديد كل أسبوع.", "Play memory/matching games, count everyday objects (fruit, spoons) and learn a new letter or number together each week."],
    },
    selfcare: {
      baby: ["دعوا {طفلكم|طفلتكم} {يمسك|تمسك} الملعقة أو كوب التدريب ولو اتّسخ الطعام، وكرّروا الروتين نفسه يومياً للنوم والأكل.", "Let your baby hold the spoon or a training cup even if it gets messy, and keep feeding and sleep routines consistent."],
      toddler: ["اتركوا {طفلكم|طفلتكم} {يحاول|تحاول} خلع الحذاء والجوارب بنفسه{|ا}، وخصّصوا وقتاً ثابتاً للحمام، وامدحوا كل محاولة حتى لو لم تنجح.", "Let your child try taking off shoes and socks, set regular potty times, and praise every attempt even if it doesn't succeed."],
      pre: ["اتركوا {طفلكم|طفلتكم} {يلبس|تلبس} ملابسه{|ا} {ويغسل|وتغسل} يديه{|ا} {ويرتّب|وترتّب} ألعابه{|ا} بنفسه{|ا} كل يوم، ولا تتدخّلوا إلا عند الحاجة وامنحوه{|ا} وقتاً كافياً.", "Let your child dress, wash hands and tidy toys alone every day; step in only when needed and allow plenty of time."],
    },
  },
  staff: {
    lang: {
      baby: ["تحدّثي مع الطفل أثناء الروتين اليومي (تغيير الحفاض، الأكل) وسمّي كل شيء تلمسينه، وغنّي أغنية قصيرة يومياً.", "Narrate the daily routine (nappy changes, meals), name everything you touch, and sing a short song daily."],
      toddler: ["اقرئي قصة مصوّرة في حلقة صغيرة يومياً واسألي أسئلة بسيطة، وأعطي الطفل وقتاً ليجيب، ثم وسّعي جملته بكلمة.", "Read a picture story to a small group daily with simple questions; wait for the answer and expand the child's phrase by one word."],
      pre: ["خصّصي وقتاً للحكي في الحلقة (ماذا فعلتَ أمس؟)، واستخدمي بطاقات صور لتكوين جمل كاملة والأناشيد ذات التكرار.", "Hold a daily circle-time sharing round, use picture cards to build full sentences, and use repetitive songs and rhymes."],
    },
    motor_g: {
      baby: ["وفّري وقتاً يومياً على الأرض على البطن وبين الوسائد للتقلّب والزحف، مع ألعاب جذّابة على مسافة قريبة.", "Provide daily floor time (tummy time, rolling, crawling) with attractive toys just out of reach."],
      toddler: ["جهّزي مسار حركة صغيراً (تسلّق وزحف ومشي على خط) ولعب الكرة يومياً في الساحة، وأمسكي بيد الطفل عند صعود الدرج.", "Set up a small movement course (climbing, crawling, line walking) and daily ball play outdoors; hold the child's hand on stairs."],
      pre: ["أضيفي ألعاب القفز والتوازن وركوب الدراجة الصغيرة ورمي الكرة نحو هدف ضمن نشاط الحركة الصباحي.", "Add hopping, balancing, a small bike and throwing at a target to the morning movement activity."],
    },
    motor_f: {
      baby: ["قدّمي أشياء آمنة للإمساك والهز، وألعاب الملمس المختلفة، وشجّعي الطفل على نقل الأشياء بين يديه.", "Offer safe objects to grasp and shake, varied textures, and encourage passing objects between hands."],
      toddler: ["ضعي ركناً للصلصال والخرز الكبير وأحجام مختلفة من المكعبات والتلوين بالأصابع، وبدّلي الأنشطة كل أسبوع.", "Set up a corner with dough, large beads, blocks and finger painting, and rotate activities weekly."],
      pre: ["درّبي الطفل على الإمساك الصحيح بالقلم عبر أنشطة التخريز والقص والتلوين داخل الحدود ولوحات الأزرار والسحّابات.", "Train pencil grip with threading, cutting, colouring within lines and button/zip boards."],
    },
    social: {
      baby: ["احتضني الطفل وابتسمي وتواصلي بالعين أثناء الرعاية، وعرّفيه تدريجياً على الأطفال الآخرين.", "Cuddle, smile and make eye contact during care, and gradually introduce the baby to other children."],
      toddler: ["نظّمي لعباً جماعياً قصيراً بأدوار بسيطة، وامدحي المشاركة والتبادل، وساعدي الطفل بالكلمات حين يتشاجر.", "Organise short group play with simple turn-taking, praise sharing, and give the child words during conflicts."],
      pre: ["أشركي الطفل في مهام جماعية صغيرة (توزيع الأدوات) وألعاب التمثيل، وناقشي المشاعر بقصص ووجوه مشاعر مرسومة.", "Give small group jobs (handing out materials), role-play games, and discuss feelings with stories and emotion cards."],
    },
    cognitive: {
      baby: ["حرّكي ألعاباً ملوّنة ببطء أمام الطفل وأخفيها وأظهريها، وقدّمي أشياء بأصوات وملامس مختلفة.", "Move bright toys slowly, hide and reveal them, and offer objects with different sounds and textures."],
      toddler: ["وفّري ألغازاً بقطع كبيرة وصناديق تصنيف بالألوان والأشكال، وكرّري النشاط نفسه عدة أيام قبل زيادة الصعوبة.", "Provide big-piece puzzles and colour/shape sorting boxes; repeat the same activity for several days before raising difficulty."],
      pre: ["استخدمي ألعاب المطابقة والذاكرة وعدّ الأشياء الحقيقية وبطاقات الحروف والأرقام، مع نشاط صغير لكل مهارة يومياً.", "Use matching and memory games, counting real objects, and letter/number cards — one short activity per skill daily."],
    },
    selfcare: {
      baby: ["اتبعي روتيناً ثابتاً للأكل والنوم، واتركي الطفل يمسك الملعقة أو الكوب بمساعدتك.", "Keep a consistent feeding and nap routine and let the baby hold the spoon or cup with your help."],
      toddler: ["خصّصي أوقاتاً ثابتة للحمام وغسل اليدين مع أغنية، وشجّعي الطفل على خلع الجوارب والحذاء بنفسه، وامدحي كل محاولة.", "Set fixed toilet and handwashing times with a song, encourage taking off socks/shoes alone, and praise every try."],
      pre: ["اجعلي الاستقلالية جزءاً من الروتين: ارتداء المعطف، ترتيب الحقيبة، غسل اليدين، مع لوحة صور تُرتّب الخطوات وإعطاء وقت كافٍ.", "Build independence into routines — coat, bag, handwashing — with a picture-step chart and plenty of time."],
    },
  },
};

// Home advice for parents on a skill rated 1-2 ("" for higher levels).
export function parentTip({ skillId, level, gender, lang }) {
  return tipFor("parent", { skillId, level, gender, lang });
}
// Classroom advice for staff on a skill rated 1-2.
export function staffTip({ skillId, level, gender, lang }) {
  return tipFor("staff", { skillId, level, gender, lang });
}
function tipFor(who, { skillId, level, gender, lang }) {
  const sk = skillById(skillId);
  if (!sk || !level || level > 2) return "";
  const pair = ACTIVITIES[who]?.[sk.domain]?.[groupOf(sk.band)];
  if (!pair) return "";
  return gen(pair[lang === "en" ? 1 : 0], gender);
}

// message for a skill at a mastery level, in "ar" | "en"
export function messageFor({ skillId, level, name, gender, lang }) {
  const sk = skillById(skillId);
  if (!sk || !level) return "";
  const l = lang === "en" ? "en" : "ar";
  const nm = (name || "").trim().split(" ")[0] || (l === "ar" ? "الطفل" : "Your child");
  const text = TPL[l][level].replace("{s}", sk[l]).replace("{n}", nm);
  return gen(text, gender).replace(/\s+$/g, "");
}

export function domainAverage(ratings, domainId) {
  const vals = Object.entries(ratings || {})
    .filter(([id]) => skillById(id)?.domain === domainId)
    .map(([, v]) => v)
    .filter((v) => v > 0);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}
