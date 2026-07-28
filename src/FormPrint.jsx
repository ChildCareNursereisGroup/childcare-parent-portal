// Renders the full submitted registration as a single print-style document
// (all 11 steps + the 17 terms + signature), meant to be captured off-screen
// with html2canvas and turned into a multi-page PDF via jsPDF. Kept as plain
// inline styles at a fixed pixel width so the rasterized output is stable
// regardless of viewport.

const PAGE_WIDTH = 794; // A4 @ 96dpi

const CLAUSES_AR = [
  "تُسدد الرسوم الشهرية مقدماً في موعد أقصاه يوم 27 من الشهر السابق لشهر الدراسة؛ ويحق للحضانة عدم قبول الطفل اعتباراً من اليوم الأول من الشهر الجديد حتى استكمال السداد، دون أي مسؤولية عليها عن ذلك.",
  "الرسوم المدفوعة (التسجيل / الحجز / الشهرية / أي رسوم إدارية) غير قابلة للاسترداد أو التحويل مهما كانت الأسباب أو الظروف.",
  "لا يحق استرداد الرسوم أو تخفيضها بسبب غياب الطفل أو مرضه.",
  "تحتفظ إدارة الحضانة بحق إيقاف تسجيل أي طفل لا يلتزم بالقواعد، أو يظهر سلوكاً غير مقبول، أو يشكل خطراً على نفسه أو على الآخرين، على أن يتم إخطار ولي الأمر كتابياً قبل أسبوع واحد من الإيقاف.",
  "يُرجى عدم إحضار الطفل للحضانة في حال مرضه، مع إبلاغ الإدارة بطبيعة المرض. وفي حال ظهرت على الطفل أعراض مرضية أثناء تواجده بالحضانة، سيتم إبلاغ ولي الأمر فوراً لاصطحابه خلال 30 دقيقة من الاتصال.",
  "في حال وقوع إصابة أو حادث، يُبلَّغ ولي الأمر فوراً، وفي الحالات الطارئة يُنقل الطفل لأقرب مركز طبي أو مستشفى لتلقي الرعاية اللازمة، دون أن تتحمل الحضانة أي مسؤولية عن مضاعفات ناتجة عن حالة صحية لم يُفصح عنها ولي الأمر.",
  "يلتزم ولي الأمر بإبلاغ الحضانة مسبقاً بأي حساسية أو نظام غذائي خاص بالطفل.",
  "يُتوقع من ولي الأمر التواصل باحترام وتعاون مع طاقم الحضانة، والالتزام بسياساتها وإجراءاتها المعتمدة.",
  "يجب حضور الطفل بالزي الموحد المعتمد من الحضانة، مع إحضار طقم ملابس إضافي ووجبة خفيفة وزجاجة ماء.",
  "لا تتحمل الحضانة مسؤولية فقد أو تلف أي مقتنيات ثمينة يحضرها الطفل معه، ويُنصح بكتابة اسم الطفل على أغراضه الشخصية.",
  "تُطبَّق رسوم تأخير قدرها 20 درهماً عن كل ساعة تأخير في اصطحاب الطفل بعد موعد الانصراف الرسمي، وكذلك في حال التسليم المبكر خارج المواعيد الرسمية.",
  "يجب استكمال جميع المستندات المطلوبة (الصور الشخصية، صور الهويات، كارت التطعيمات) لإتمام إجراءات تسجيل الطفل.",
  "في حال رغبة ولي الأمر بسحب الطفل، يجب تقديم إشعار كتابي مسبق للإدارة بمدة لا تقل عن شهر واحد؛ ولا يحق استرداد أي رسوم مدفوعة عن الفترة الجارية.",
  "يفوّض ولي الأمر إدارة الحضانة باتخاذ الإجراءات الإسعافية الأولية اللازمة عند الضرورة القصوى، على أن يتم إبلاغه فوراً بذلك.",
  "لن يُسلَّم الطفل إلا لولي الأمر أو لأحد الأشخاص المصرح لهم المذكورين في هذه الاستمارة، مع إبراز الهوية عند الاستلام.",
  "يقر ولي الأمر بصحة واكتمال جميع البيانات الواردة في هذه الاستمارة، ويتحمل وحده المسؤولية الكاملة عن أي ضرر ينتج عن عدم الإفصاح عن معلومة جوهرية.",
  "بتسجيل طفلك في مجموعة رعاية الطفل للحضانات، فإنك تقر وتوافق على جميع القواعد والشروط الواردة في هذه الاستمارة، والمتوافقة مع اشتراطات هيئة الشارقة للتعليم الخاص (سبيا) ووزارة تنمية المجتمع.",
];

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 18, breakInside: "avoid" }}>
      <div style={{ background: "#0f172a", color: "#fff", fontWeight: 800, fontSize: 13, padding: "6px 10px", borderRadius: 6 }}>{title}</div>
      <div style={{ padding: "8px 4px" }}>{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, padding: "3px 6px", borderBottom: "1px solid #f1f5f9" }}>
      <span style={{ color: "#64748b" }}>{label}</span>
      <span style={{ fontWeight: 700, color: "#0f172a", textAlign: "left" }}>{String(value)}</span>
    </div>
  );
}

export default function FormPrintView({ f, branchLabel, billing, signatureDataUrl }) {
  const freqAr = { monthly: "شهري", weekly: "أسبوعي", daily: "يومي" }[f.frequency] || f.frequency;
  const siblings = Array.isArray(f.siblings) ? f.siblings.filter((s) => s?.name) : [];
  const pickup = Array.isArray(f.pickupPersons) ? f.pickupPersons.filter((p) => p?.name) : [];
  const skills = f.skills && typeof f.skills === "object" ? Object.entries(f.skills).filter(([, v]) => v).map(([k]) => k) : [];

  return (
    <div dir="rtl" style={{ width: PAGE_WIDTH, padding: 28, background: "#fff", fontFamily: "Tajawal, Arial, sans-serif", color: "#0f172a" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>مجموعة رعاية الطفل للحضانات</div>
        <div style={{ fontSize: 13, color: "#64748b" }}>استمارة تسجيل طفل — {branchLabel || "-"}</div>
      </div>

      <Section title="١. بيانات الطفل الأساسية">
        <Row label="اسم الطفل رباعياً" value={f.name} />
        <Row label="اسم الشهرة / التدليل" value={f.nick} />
        <Row label="تاريخ الميلاد" value={f.dob} />
        <Row label="النوع" value={f.gender === "boy" ? "ذكر" : f.gender === "girl" ? "أنثى" : f.gender} />
        <Row label="الجنسية" value={f.nat === "Other" ? f.natOther : f.nat} />
        <Row label="الديانة" value={f.religion === "Other" ? f.religionOther : f.religion} />
        <Row label="اللغة الأولى للطفل" value={f.lang1 === "Other" ? f.lang1Other : f.lang1} />
        <Row label="لغات أخرى بالمنزل" value={f.langOther} />
        <Row label="العنوان" value={f.address} />
        <Row label="المواصلات" value={f.transport === "bus" ? "باص الحضانة" : f.transport === "parent" ? "مع ولي الأمر" : f.transport} />
      </Section>

      <Section title="٢. بيانات الأب">
        <Row label="اسم الأب" value={f.fName} />
        <Row label="الجنسية" value={f.fNat === "Other" ? f.fNatOther : f.fNat} />
        <Row label="اللغة الأولى" value={f.fLang === "Other" ? f.fLangOther : f.fLang} />
        <Row label="رقم الهوية / الجواز" value={f.fId} />
        <Row label="الوظيفة وجهة العمل" value={f.fJob} />
        <Row label="المدينة" value={f.fCity === "Other" ? f.fCityOther : f.fCity} />
        <Row label="هاتف المنزل" value={f.fHome} />
        <Row label="رقم الهاتف المتحرك" value={f.fMobile} />
        <Row label="البريد الإلكتروني" value={f.fEmail} />
        <Row label="الحالة الاجتماعية" value={{ married: "متزوجان", separated: "منفصلان", widowed: "أرمل/أرملة" }[f.marital] || f.marital} />
      </Section>

      <Section title="٣. بيانات الأم">
        <Row label="اسم الأم" value={f.mName} />
        <Row label="الجنسية" value={f.mNat === "Other" ? f.mNatOther : f.mNat} />
        <Row label="اللغة الأولى" value={f.mLang === "Other" ? f.mLangOther : f.mLang} />
        <Row label="رقم الهوية / الجواز" value={f.mId} />
        <Row label="الوظيفة وجهة العمل" value={f.mJob} />
        <Row label="المدينة" value={f.mCity === "Other" ? f.mCityOther : f.mCity} />
        <Row label="هاتف المنزل" value={f.mHome} />
        <Row label="رقم الهاتف المتحرك" value={f.mMobile} />
        <Row label="البريد الإلكتروني" value={f.mEmail} />
      </Section>

      <Section title="٤. الإخوة وجهة اتصال الطوارئ">
        {siblings.length > 0 && (
          <div style={{ fontSize: 12, marginBottom: 6 }}>
            {siblings.map((s, i) => (<div key={i}>{s.name} — {s.dob} — {s.school}</div>))}
          </div>
        )}
        <Row label="اسم جهة الطوارئ" value={f.emName} />
        <Row label="صلة القرابة" value={f.emRel} />
        <Row label="رقم الجوال" value={f.emMobile} />
        <Row label="هاتف المنزل / العمل" value={f.emHome} />
      </Section>

      {pickup.length > 0 && (
        <Section title="٥. الأشخاص المصرح لهم بالاستلام">
          <div style={{ fontSize: 12 }}>
            {pickup.map((p, i) => (<div key={i}>{p.name} — {p.relation} — {p.phone}</div>))}
          </div>
        </Section>
      )}

      <Section title="٦. الحالة الصحية">
        <Row label="أمراض مزمنة؟" value={f.illness === "yes" ? `نعم — ${f.illnessDetail || ""}` : "لا"} />
        <Row label="أدوية منتظمة؟" value={f.meds === "yes" ? `نعم — ${f.medsDetail || ""}` : "لا"} />
        <Row label="حساسية أطعمة/أدوية؟" value={f.allergy === "yes" ? `نعم — ${f.allergyDetail || ""}` : "لا"} />
        <Row label="فصيلة الدم" value={f.blood} />
        <Row label="التطعيمات مكتملة؟" value={f.vax === "yes" ? "نعم" : "لا"} />
        <Row label="نظارة / سماعة؟" value={f.glasses === "yes" ? "نعم" : "لا"} />
        <Row label="مشكلة سمع أو نظر؟" value={f.hearing === "yes" ? "نعم" : "لا"} />
        <Row label="طبيب الطفل وهاتفه" value={f.doctor} />
      </Section>

      <Section title="٧. عن الطفل ومهاراته">
        <Row label="ترتيبه بين إخوته" value={{ first: "الأكبر", middle: "الأوسط", last: "الأصغر" }[f.order] || f.order} />
        <Row label="الهوايات / الألعاب المفضلة" value={f.hobbies} />
        <Row label="الألوان المفضلة" value={f.colors} />
        <Row label="شخصية الطفل" value={f.personality} />
        <Row label="أكثر شيء يحبه" value={f.loves} />
        <Row label="أكثر شيء يخيفه" value={f.fears} />
        {skills.length > 0 && <Row label="مهارات الطفل" value={skills.join("، ")} />}
      </Section>

      <Section title="٨. العادات والموافقة">
        <Row label="عدد ساعات النوم يومياً" value={f.sleepHrs} />
        <Row label="ينام بمفرده؟" value={f.sleepAlone === "yes" ? "نعم" : "لا"} />
        <Row label="الأطعمة المفضلة" value={f.foodLike} />
        <Row label="الأطعمة الممنوعة" value={f.foodNo} />
        <Row label="يستخدم لهاية/رضّاعة؟" value={f.pacifier === "yes" ? "نعم" : "لا"} />
        <Row label="موافقة استخدام الوسائط" value={f.media === "yes" ? "نعم" : "لا"} />
      </Section>

      <Section title="٩. الخطة والرسوم">
        <Row label="طريقة الدفع" value={freqAr} />
        <Row label="الرسوم الدورية" value={billing ? `${billing.recurring_fee} د.إ` : "-"} />
        <Row label="الرسوم لمرة واحدة" value={billing ? `${billing.one_time_fee} د.إ` : "-"} />
      </Section>

      <Section title="١٠. المستندات المرفقة">
        <div style={{ fontSize: 12, color: "#334155" }}>هوية الأب، هوية الأم، هوية/شهادة ميلاد الطفل، صورة الطفل، كارت التطعيمات — مرفقة كملفات منفصلة مع هذه الاستمارة.</div>
      </Section>

      <Section title="١١. الإقرار والشروط">
        <div style={{ fontSize: 10.5, lineHeight: 1.7, color: "#334155" }}>
          {CLAUSES_AR.map((c, i) => (<p key={i} style={{ margin: "4px 0" }}>{i + 1}. {c}</p>))}
        </div>
        <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700 }}>✓ أوافق على جميع الشروط والأحكام</div>
        <div style={{ marginTop: 10 }}>
          <Row label="اسم ولي الأمر الموقّع" value={f.sigName} />
          <Row label="رقم الهوية الإماراتية" value={f.sigId} />
          <Row label="التاريخ" value={f.sigDate} />
        </div>
        {signatureDataUrl && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>التوقيع:</div>
            <img src={signatureDataUrl} alt="signature" style={{ maxWidth: 260, border: "1px solid #e2e8f0", borderRadius: 8, padding: 6 }} />
          </div>
        )}
      </Section>
    </div>
  );
}
