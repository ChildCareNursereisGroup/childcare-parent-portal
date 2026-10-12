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

export function ReportPage({ lang, children }) {
  return (
    <div dir={lang === "en" ? "ltr" : "rtl"} style={{ width: REPORT_PAGE_W, height: REPORT_PAGE_H, padding: REPORT_PAD, boxSizing: "border-box", background: "#fff", fontFamily: "Tajawal, Arial, sans-serif", color: "#0f172a", overflow: "hidden" }}>
      {children}
    </div>
  );
}
