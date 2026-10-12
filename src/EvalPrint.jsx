// Printable monthly development report (rasterized into the PDF emailed to parents).
// `report` shape: { childName, monthLabel, bandLabel, teacher, intro, note,
//   domains: [{ id, title, icon, avg, items: [{ skill, level, levelLabel, color, message }] }] }

const PAGE_WIDTH = 794;

export default function EvalPrintView({ report, branchLabel }) {
  return (
    <div dir="rtl" style={{ width: PAGE_WIDTH, padding: 32, background: "#fff", fontFamily: "Tajawal, Arial, sans-serif", color: "#0f172a" }}>
      <div style={{ background: "linear-gradient(135deg,#0ea5e9,#06b6d4)", borderRadius: 16, padding: "18px 22px", color: "#fff", textAlign: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 13, opacity: 0.9 }}>مجموعة رعاية الطفل للحضانات{branchLabel ? ` — ${branchLabel}` : ""}</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>تقرير نمو {report.childName}</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>{report.monthLabel}{report.bandLabel ? ` · المرحلة: ${report.bandLabel}` : ""}{report.teacher ? ` · المعلمة: ${report.teacher}` : ""}</div>
      </div>

      {report.intro && (
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "12px 16px", fontSize: 13, lineHeight: 1.9, marginBottom: 16 }}>{report.intro}</div>
      )}

      {report.domains.map((d) => (
        <div key={d.id} style={{ marginBottom: 14, border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, breakInside: "avoid" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 800 }}>{d.icon} {d.title}</span>
            <span style={{ color: "#EF9F27", fontSize: 16, letterSpacing: 1 }}>{"★".repeat(d.avg)}<span style={{ color: "#e2e8f0" }}>{"★".repeat(5 - d.avg)}</span></span>
          </div>
          {d.items.map((it, i) => (
            <div key={i} style={{ borderRight: `4px solid ${it.color}`, background: `${it.color}12`, borderRadius: 8, padding: "8px 12px", marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: it.color }}>{it.skill} — {it.levelLabel}</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.8, color: "#334155", marginTop: 2 }}>{it.message}</div>
            </div>
          ))}
        </div>
      ))}

      {report.note && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 16px", fontSize: 13, lineHeight: 1.9, marginTop: 6 }}>
          <b>ملاحظة من المعلمة:</b> {report.note}
        </div>
      )}

      <div style={{ textAlign: "center", fontSize: 12, color: "#64748b", marginTop: 18 }}>
        شكراً لثقتكم بنا 💛 — نسعد دائماً بالتواصل معكم لأي استفسار.
      </div>
    </div>
  );
}
