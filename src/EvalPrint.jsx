// Printable monthly development report (rasterized into the PDF emailed to parents),
// available in Arabic and English.
// `report` shape: { lang, childName, monthLabel, bandLabel, teacher, intro, note,
//   domains: [{ id, title, icon, avg, items: [{ skill, level, levelLabel, color, message, tip }] }] }

const PAGE_WIDTH = 794;

const T = {
  ar: {
    group: "مجموعة رعاية الطفل للحضانات",
    title: (n) => `تقرير نمو ${n}`,
    stage: "المرحلة",
    teacher: "المعلمة",
    note: "ملاحظة من المعلمة:",
    tip: "💡 نصيحة للأهل:",
    thanks: "شكراً لثقتكم بنا 💛 — نسعد دائماً بالتواصل معكم لأي استفسار.",
  },
  en: {
    group: "Child Care Nurseries Group",
    title: (n) => `${n}'s Development Report`,
    stage: "Stage",
    teacher: "Teacher",
    note: "Note from the teacher:",
    tip: "💡 Tip for parents:",
    thanks: "Thank you for trusting us 💛 — we're always happy to hear from you.",
  },
};

export const REPORT_PAGE_W = PAGE_WIDTH;
export const REPORT_PAGE_H = 1123;
export const REPORT_PAD = 32;

// The report as whole blocks, so the PDF never cuts a skill box across two pages.
export function buildReportBlocks(report, branchLabel) {
  const en = report.lang === "en";
  const t = T[en ? "en" : "ar"];
  const side = en ? "borderLeft" : "borderRight";
  const blocks = [];
  blocks.push({
    key: "head",
    el: (
      <div>
        <div style={{ background: "linear-gradient(135deg,#0ea5e9,#06b6d4)", borderRadius: 16, padding: "20px 24px", color: "#fff", textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 15, opacity: 0.95 }}>{t.group}{branchLabel ? ` — ${branchLabel}` : ""}</div>
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{t.title(report.childName)}</div>
          <div style={{ fontSize: 15, marginTop: 4 }}>{report.monthLabel}{report.bandLabel ? ` · ${t.stage}: ${report.bandLabel}` : ""}{report.teacher ? ` · ${t.teacher}: ${report.teacher}` : ""}</div>
        </div>
        {report.intro && (
          <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "14px 18px", fontSize: 15.5, lineHeight: 1.9 }}>{report.intro}</div>
        )}
      </div>
    ),
  });
  report.domains.forEach((d) => {
    blocks.push({
      key: "d-" + d.id,
      el: (
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 800 }}>{d.icon} {d.title}</span>
            <span dir="ltr" style={{ color: "#EF9F27", fontSize: 18, letterSpacing: 1 }}>{"★".repeat(d.avg)}<span style={{ color: "#e2e8f0" }}>{"★".repeat(5 - d.avg)}</span></span>
          </div>
          {d.items.map((it, i) => (
            <div key={i} style={{ [side]: `5px solid ${it.color}`, background: `${it.color}12`, borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: it.color }}>{it.skill} — {it.levelLabel}</div>
              <div style={{ fontSize: 15, lineHeight: 1.8, color: "#334155", marginTop: 3 }}>{it.message}</div>
              {it.tip && (
                <div style={{ fontSize: 14.5, lineHeight: 1.8, color: "#065f46", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 8, padding: "8px 12px", marginTop: 6 }}>
                  <b>{t.tip}</b> {it.tip}
                </div>
              )}
            </div>
          ))}
        </div>
      ),
    });
  });
  blocks.push({
    key: "foot",
    el: (
      <div>
        {report.note && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 18px", fontSize: 15.5, lineHeight: 1.9 }}>
            <b>{t.note}</b> {report.note}
          </div>
        )}
        <div style={{ textAlign: "center", fontSize: 14, color: "#64748b", marginTop: 16 }}>{t.thanks}</div>
      </div>
    ),
  });
  return blocks;
}

export function ReportPage({ lang, children, footer }) {
  return (
    <div dir={lang === "en" ? "ltr" : "rtl"} style={{ width: REPORT_PAGE_W, height: REPORT_PAGE_H, padding: REPORT_PAD, boxSizing: "border-box", position: "relative", background: "#fff", fontFamily: "Tajawal, Arial, sans-serif", color: "#0f172a", overflow: "hidden" }}>
      {children}
      {footer && <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center", fontSize: 11.5, color: "#94a3b8" }}>{footer}</div>}
    </div>
  );
}

const PT = {
  ar: {
    group: "مجموعة رعاية الطفل للحضانات",
    title: "خطة دعم النمو",
    sub: "للمعلمة — تُحفظ في ملف الطفل",
    child: "الطفل", month: "الشهر", stage: "المرحلة", teacher: "المعلمة",
    intro: "المهارات التالية تحتاج إلى دعم إضافي هذا الشهر. نفّذي النشاط المقترح مع الطفل في الفصل بشكل يومي، وسجّلي التقدّم عند المراجعة.",
    cls: "🧑‍🏫 في الحضانة:", home: "🏠 نصيحة للأهل (مذكورة في تقرير الأهل):",
    start: "تاريخ البدء:", review: "تاريخ المراجعة:", progress: "التقدّم:", better: "تحسّن", same: "كما هو", refer: "يحتاج متابعة إضافية", notes: "ملاحظات:",
    teacherSig: "توقيع المعلمة", mgrSig: "توقيع مديرة الفرع", date: "التاريخ",
  },
  en: {
    group: "Child Care Nurseries Group",
    title: "Development Support Plan",
    sub: "For staff — keep in the child's file",
    child: "Child", month: "Month", stage: "Stage", teacher: "Teacher",
    intro: "The skills below need extra support this month. Do the suggested activity with the child in class every day and record progress at the review.",
    cls: "🧑‍🏫 In class:", home: "🏠 Tip for parents (also in the parents' report):",
    start: "Start date:", review: "Review date:", progress: "Progress:", better: "Improving", same: "Same", refer: "Needs further follow-up", notes: "Notes:",
    teacherSig: "Teacher's signature", mgrSig: "Branch manager's signature", date: "Date",
  },
};

// plan: { lang, childName, monthLabel, bandLabel, teacher, items: [{ domain, skill, level, levelLabel, color, staffTip, parentTip }] }
export function buildPlanBlocks(plan, branchLabel) {
  const en = plan.lang === "en";
  const t = PT[en ? "en" : "ar"];
  const side = en ? "borderLeft" : "borderRight";
  const line = { borderBottom: "1px solid #94a3b8", display: "inline-block", minWidth: 120, height: 18, verticalAlign: "bottom" };
  const box = { display: "inline-block", width: 13, height: 13, border: "1.5px solid #475569", borderRadius: 3, verticalAlign: "middle", margin: en ? "0 5px 0 0" : "0 0 0 5px" };
  const blocks = [];
  blocks.push({
    key: "head",
    el: (
      <div>
        <div style={{ borderBottom: "3px solid #7c3aed", paddingBottom: 10, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 14, color: "#64748b" }}>{t.group}{branchLabel ? ` — ${branchLabel}` : ""}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#5b21b6" }}>{t.title}</div>
          </div>
          <div style={{ fontSize: 13, color: "#64748b" }}>{t.sub}</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {[[t.child, plan.childName], [t.month, plan.monthLabel], [t.stage, plan.bandLabel], [t.teacher, plan.teacher]].filter((x) => x[1]).map(([k, v]) => (
            <div key={k} style={{ flex: "1 1 160px", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 10, padding: "8px 12px" }}>
              <div style={{ fontSize: 12, color: "#6d28d9", fontWeight: 700 }}>{k}</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 14.5, lineHeight: 1.9, color: "#334155" }}>{t.intro}</div>
      </div>
    ),
  });
  plan.items.forEach((it, i) => {
    blocks.push({
      key: "i-" + i,
      el: (
        <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ fontSize: 16.5, fontWeight: 800 }}>{i + 1}. {it.skill} <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>({it.domain})</span></div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", background: it.color, borderRadius: 999, padding: "2px 12px", whiteSpace: "nowrap" }}>{it.levelLabel}</div>
          </div>
          <div style={{ [side]: "4px solid #7c3aed", background: "#f5f3ff", borderRadius: 8, padding: "8px 12px", fontSize: 15, lineHeight: 1.8, marginBottom: 6 }}>
            <b style={{ color: "#5b21b6" }}>{t.cls}</b> {it.staffTip}
          </div>
          <div style={{ [side]: "4px solid #10b981", background: "#ecfdf5", borderRadius: 8, padding: "6px 12px", fontSize: 13.5, lineHeight: 1.7, color: "#065f46", marginBottom: 10 }}>
            <b>{t.home}</b> {it.parentTip}
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 2.1 }}>
            {t.start} <span style={line} />&nbsp;&nbsp; {t.review} <span style={line} />
            <br />
            {t.progress} <span style={box} />{t.better} &nbsp; <span style={box} />{t.same} &nbsp; <span style={box} />{t.refer}
            <br />
            {t.notes} <span style={{ ...line, minWidth: 440 }} />
          </div>
        </div>
      ),
    });
  });
  blocks.push({
    key: "sig",
    el: (
      <div style={{ display: "flex", gap: 24, marginTop: 14, fontSize: 14 }}>
        {[t.teacherSig, t.mgrSig].map((x) => (
          <div key={x} style={{ flex: 1 }}>
            <div style={{ height: 38, borderBottom: "1.5px solid #475569" }} />
            <div style={{ marginTop: 4, color: "#475569" }}>{x}</div>
          </div>
        ))}
        <div style={{ flex: 0.7 }}>
          <div style={{ height: 38, borderBottom: "1.5px solid #475569" }} />
          <div style={{ marginTop: 4, color: "#475569" }}>{t.date}</div>
        </div>
      </div>
    ),
  });
  return blocks;
}
