// Printable manager-facing progress reports (Arabic + English):
//  - branch monthly progress report (month-to-month comparison for the whole branch)
//  - single child's progress comparison across months
// Built as whole blocks so the PDF packer never splits a section across pages.
import { DOMAINS, LEVELS, skillById } from "./devBank";
import { levelOf, monthLabel } from "./progress";

const PT = {
  ar: {
    group: "مجموعة رعاية الطفل للحضانات",
    branchTitle: "تقرير نمو الأطفال الشهري — الفرع",
    childTitle: "مقارنة نمو الطفل عبر الشهور",
    ref: "مؤشرات إطار الشارقة: 1.1 التطور مقارنة بالعمر · 1.2 معدل التقدّم · 2.7 استخدام التقييم لدعم التعلّم",
    month: "الشهر", branch: "الفرع", compare: "المقارنة", compareVal: "مع آخر تقييم سابق لكل طفل",
    kids: "عدد الأطفال", evaluated: "تم تقييمهم", improved: "تحسّنوا", same: "ثابتون", declined: "تراجعوا", support: "يحتاجون دعماً",
    of: "من", noPrev: "لا توجد بيانات شهر سابق للمقارنة بعد",
    hl: "أبرز النقاط", lowest: "أقل مجال متوسطاً:", strongest: "أقوى مجال:", avgAll: "متوسط الفرع العام (من 5):",
    domainsT: "أداء الأطفال حسب المجال", onTrack: "على المستوى المتوقع", progressing: "في تقدّم", needSupport: "يحتاج دعماً", avg: "المتوسط", change: "التغيّر",
    supportT: "أطفال يحتاجون دعماً إضافياً", persistent: "⚠ مستمر", skillsN: "مهارة", domainsLbl: "المجالات:", allDomains: "كل المجالات",
    noSupport: "لا يوجد أطفال بمهارات في المستوى 1 أو 2 هذا الشهر 🎉",
    tableT: "تقدّم كل طفل", name: "الطفل", prev: "السابق", now: "الحالي", lowSk: "مهارات تحتاج دعماً",
    missingT: "لم يُجرَ تقييمهم الشهري بعد",
    sigMgr: "توقيع مديرة الفرع", sigDate: "التاريخ", notes: "ملاحظات وقرارات المديرة:",
    stage: "المرحلة", teacher: "المعلمة", matrixT: "متوسط كل مجال عبر الشهور (من 5)", overall: "المتوسط العام",
    improvedT: "مهارات تحسّنت عن الشهر السابق", stillT: "مهارات ما زالت تحتاج دعماً (شهرين أو أكثر)", newT: "مهارات جديدة تحتاج دعماً", declinedT: "مهارات تراجعت",
    from: "من", to: "إلى", none: "—", needMore: "يلزم تقييمان على الأقل للمقارنة.",
    page: "صفحة", skillsWord: "مهارة",
  },
  en: {
    group: "Child Care Nurseries Group",
    branchTitle: "Monthly Child Development Progress — Branch",
    childTitle: "Child Progress Across Months",
    ref: "Sharjah framework indicators: 1.1 Development vs age milestones · 1.2 Rate of progress · 2.7 Using assessment to support learning",
    month: "Month", branch: "Branch", compare: "Compared with", compareVal: "each child's previous evaluation",
    kids: "Children", evaluated: "Evaluated", improved: "Improved", same: "Steady", declined: "Declined", support: "Need support",
    of: "of", noPrev: "No previous-month data to compare yet",
    hl: "Highlights", lowest: "Lowest-scoring domain:", strongest: "Strongest domain:", avgAll: "Branch overall average (out of 5):",
    domainsT: "Children's performance by domain", onTrack: "On track", progressing: "Progressing", needSupport: "Needs support", avg: "Average", change: "Change",
    supportT: "Children who need extra support", persistent: "⚠ ongoing", skillsN: "skills", domainsLbl: "Domains:", allDomains: "All domains",
    noSupport: "No children with skills at level 1 or 2 this month 🎉",
    tableT: "Each child's progress", name: "Child", prev: "Previous", now: "Now", lowSk: "Skills needing support",
    missingT: "Monthly evaluation not done yet",
    sigMgr: "Branch manager's signature", sigDate: "Date", notes: "Manager's notes and decisions:",
    stage: "Stage", teacher: "Teacher", matrixT: "Domain average across months (out of 5)", overall: "Overall average",
    improvedT: "Skills that improved since last month", stillT: "Skills still needing support (2+ months)", newT: "New skills needing support", declinedT: "Skills that declined",
    from: "from", to: "to", none: "—", needMore: "At least two evaluations are needed for a comparison.",
    page: "Page", skillsWord: "skills",
  },
};

const ARROW = { 1: ["▲", "#059669"], 0: ["●", "#94a3b8"], "-1": ["▼", "#dc2626"] };
const arrow = (t) => (t === null || t === undefined ? ["", "#94a3b8"] : ARROW[String(t)]);
const f1 = (n) => (n ? n.toFixed(1) : "—");
const Chg = ({ a, c, v }) => (<span dir="ltr" style={{ unicodeBidi: "isolate", color: c, whiteSpace: "nowrap" }}>{a} {v}</span>);
const sgn = (n) => (n === null || n === undefined ? "" : `${n > 0.05 ? "+" : ""}${n.toFixed(1)}`);

function Head({ t, title, lines, color = "#0ea5e9" }) {
  return (
    <div style={{ borderBottom: `3px solid ${color}`, paddingBottom: 10, marginBottom: 12 }}>
      <div style={{ fontSize: 14, color: "#64748b" }}>{t.group}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#0c4a6e" }}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {lines.filter((x) => x[1]).map(([k, v]) => (
          <div key={k} style={{ flex: "1 1 150px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 10, padding: "6px 12px" }}>
            <div style={{ fontSize: 12, color: "#0369a1", fontWeight: 700 }}>{k}</div>
            <div style={{ fontSize: 15.5, fontWeight: 800 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 8 }}>{t.ref}</div>
    </div>
  );
}

const SigBlock = ({ t }) => (
  <div>
    <div style={{ fontSize: 14, color: "#475569", marginBottom: 6 }}>{t.notes}</div>
    {[0, 1, 2].map((i) => (<div key={i} style={{ height: 26, borderBottom: "1px solid #cbd5e1" }} />))}
    <div style={{ display: "flex", gap: 24, marginTop: 18, fontSize: 14 }}>
      {[t.sigMgr, t.sigDate].map((x, i) => (
        <div key={x} style={{ flex: i === 0 ? 1.6 : 1 }}>
          <div style={{ height: 34, borderBottom: "1.5px solid #475569" }} />
          <div style={{ marginTop: 4, color: "#475569" }}>{x}</div>
        </div>
      ))}
    </div>
  </div>
);

// ---------------- Branch report ----------------
export function buildBranchReportBlocks({ summary: s, month, lang, branchLabel, classNameById }) {
  const en = lang === "en";
  const t = PT[en ? "en" : "ar"];
  const name = (d) => (en ? d.en : d.ar);
  const domName = (id) => { const d = DOMAINS.find((x) => x.id === id); return d ? name(d) : id; };
  const blocks = [];

  blocks.push({
    key: "head",
    el: <Head t={t} title={t.branchTitle} lines={[[t.branch, branchLabel], [t.month, monthLabel(month, lang)], [t.compare, t.compareVal]]} />,
  });

  const kpi = (label, value, sub, color) => (
    <div key={label} style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
      <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 13.5, fontWeight: 700 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: "#64748b" }}>{sub}</div>}
    </div>
  );
  blocks.push({
    key: "kpi",
    el: (
      <div>
        <div style={{ display: "flex", gap: 10 }}>
          {kpi(t.kids, s.total, "", "#0369a1")}
          {kpi(t.evaluated, s.evaluated, s.total ? `${Math.round((s.evaluated / s.total) * 100)}%` : "", "#0891b2")}
          {kpi(t.improved, s.improved, s.comparable ? `${t.of} ${s.comparable}` : "", "#059669")}
          {kpi(t.same, s.same, "", "#64748b")}
          {kpi(t.declined, s.declined, "", "#dc2626")}
          {kpi(t.support, s.supportKids.length, "", "#d97706")}
        </div>
        {s.comparable === 0 && <div style={{ fontSize: 13, color: "#64748b", marginTop: 6 }}>{t.noPrev}</div>}
        {s.evaluated > 0 && (
          <div style={{ marginTop: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 14px", fontSize: 14.5, lineHeight: 1.9 }}>
            <b>{t.hl}</b><br />
            {t.avgAll} <b>{f1(s.overallAvg)}</b>
            {s.strongestDomain && <><br />{t.strongest} <b>{s.strongestDomain.icon} {name(s.strongestDomain)}</b> ({f1(s.strongestDomain.avg)})</>}
            {s.lowestDomain && <><br />{t.lowest} <b>{s.lowestDomain.icon} {name(s.lowestDomain)}</b> ({f1(s.lowestDomain.avg)})</>}
          </div>
        )}
      </div>
    ),
  });

  blocks.push({
    key: "domains",
    el: (
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>{t.domainsT}</div>
        <div style={{ display: "flex", gap: 14, fontSize: 12.5, color: "#475569", marginBottom: 8 }}>
          <span><i style={{ display: "inline-block", width: 10, height: 10, background: "#10b981", borderRadius: 2 }} /> {t.onTrack}</span>
          <span><i style={{ display: "inline-block", width: 10, height: 10, background: "#f59e0b", borderRadius: 2 }} /> {t.progressing}</span>
          <span><i style={{ display: "inline-block", width: 10, height: 10, background: "#ef4444", borderRadius: 2 }} /> {t.needSupport}</span>
        </div>
        {s.domains.map((d) => {
          const [a, c] = arrow(d.change === null ? null : d.change >= 0.25 ? 1 : d.change <= -0.25 ? -1 : 0);
          const pct = (x) => (d.n ? (x / d.n) * 100 : 0);
          return (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 190, fontSize: 14.5, fontWeight: 700 }}>{d.icon} {name(d)}</div>
              <div dir="ltr" style={{ flex: 1, display: "flex", height: 16, borderRadius: 8, overflow: "hidden", background: "#e2e8f0" }}>
                <div style={{ width: `${pct(d.onTrack)}%`, background: "#10b981" }} />
                <div style={{ width: `${pct(d.progressing)}%`, background: "#f59e0b" }} />
                <div style={{ width: `${pct(d.support)}%`, background: "#ef4444" }} />
              </div>
              <div style={{ width: 150, fontSize: 13, textAlign: "center" }}>{d.onTrack}/{d.progressing}/{d.support}</div>
              <div style={{ width: 90, fontSize: 14.5, fontWeight: 800, textAlign: "center" }}>
                {f1(d.avg)} <span style={{ fontSize: 13 }}><Chg a={a} c={c} v={sgn(d.change)} /></span>
              </div>
            </div>
          );
        })}
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{t.onTrack} / {t.progressing} / {t.needSupport} · {t.avg} · {t.change}</div>
      </div>
    ),
  });

  // children needing support (chunks)
  const chunk = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };
  if (s.supportKids.length === 0) {
    blocks.push({ key: "nosupport", el: (<div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 12, padding: "12px 16px", fontSize: 15, color: "#065f46" }}>{t.noSupport}</div>) });
  } else {
    chunk(s.supportKids, 8).forEach((rows, ci) => {
      blocks.push({
        key: "sup" + ci,
        el: (
          <div style={{ border: "1px solid #fde68a", background: "#fffbeb", borderRadius: 12, padding: 12 }}>
            {ci === 0 && <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8, color: "#92400e" }}>{t.supportT} ({s.supportKids.length})</div>}
            {rows.map((k) => (
              <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: "1px dashed #fcd34d", fontSize: 14.5 }}>
                <div style={{ flex: "0 0 170px", fontWeight: 800 }}>{k.name}</div>
                <div style={{ flex: 1, color: "#475569", fontSize: 13.5 }}>{t.domainsLbl} {k.domains.length >= DOMAINS.length ? t.allDomains : k.domains.map(domName).join(en ? ", " : "، ")}</div>
                <div style={{ fontWeight: 700 }}>{k.count} {t.skillsWord}</div>
                {k.persistent > 0 && <div style={{ color: "#b91c1c", fontWeight: 800, fontSize: 13 }}>{t.persistent} ({k.persistent})</div>}
              </div>
            ))}
          </div>
        ),
      });
    });
  }

  // every child's progress table
  if (s.rows.length) {
    chunk(s.rows, 12).forEach((rows, ci) => {
      blocks.push({
        key: "tbl" + ci,
        el: (
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            {ci === 0 && <div style={{ fontSize: 17, fontWeight: 800, padding: "10px 14px 4px" }}>{t.tableT}</div>}
            <div style={{ display: "flex", background: "#e0f2fe", fontSize: 13, fontWeight: 800, padding: "6px 14px" }}>
              <div style={{ flex: 2 }}>{t.name}</div>
              <div style={{ flex: 1, textAlign: "center" }}>{t.prev}</div>
              <div style={{ flex: 1, textAlign: "center" }}>{t.now}</div>
              <div style={{ flex: 1, textAlign: "center" }}>{t.change}</div>
              <div style={{ flex: 1.3, textAlign: "center" }}>{t.lowSk}</div>
            </div>
            {rows.map((r, i) => {
              const [a, c] = arrow(r.t);
              const lv = levelOf(r.now.overall);
              return (
                <div key={r.id} style={{ display: "flex", alignItems: "center", fontSize: 14, padding: "6px 14px", background: i % 2 ? "#f8fafc" : "#fff", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ flex: 2, fontWeight: 700 }}>{r.name}{classNameById?.[r.classId] ? <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: 12 }}> · {classNameById[r.classId]}</span> : null}</div>
                  <div style={{ flex: 1, textAlign: "center", color: "#64748b" }}>{r.prev ? f1(r.prev.overall) : "—"}</div>
                  <div style={{ flex: 1, textAlign: "center", fontWeight: 800, color: lv.color }}>{f1(r.now.overall)}</div>
                  <div style={{ flex: 1, textAlign: "center", fontWeight: 800 }}><Chg a={a} c={c} v={r.prev ? sgn(r.now.overall - r.prev.overall) : ""} /></div>
                  <div style={{ flex: 1.3, textAlign: "center", color: r.lowCount ? "#b45309" : "#94a3b8", fontWeight: r.lowCount ? 800 : 400 }}>{r.lowCount || "—"}</div>
                </div>
              );
            })}
            <div style={{ height: 6 }} />
          </div>
        ),
      });
    });
  }

  if (s.missing.length) {
    blocks.push({
      key: "missing",
      el: (
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>⏳ {t.missingT} ({s.missing.length})</div>
          <div style={{ fontSize: 14, lineHeight: 1.9, color: "#475569" }}>{s.missing.map((m) => m.name).join(en ? ", " : "، ")}</div>
        </div>
      ),
    });
  }

  blocks.push({ key: "sig", el: <SigBlock t={t} /> });
  return blocks;
}

// ---------------- Single child's comparison ----------------
export function buildChildProgressBlocks({ p, f, lang, branchLabel }) {
  const en = lang === "en";
  const t = PT[en ? "en" : "ar"];
  const name = (d) => (en ? d.en : d.ar);
  const lbl = (v) => { const L = LEVELS.find((x) => x.v === v); return L ? (en ? L.en : L.ar) : ""; };
  const sk = (id) => { const s = skillById(id); return s ? (en ? s.en : s.ar) : id; };
  const blocks = [];
  const latest = p.latest;

  blocks.push({
    key: "head",
    el: <Head t={t} title={`${t.childTitle}`} color="#7c3aed" lines={[[en ? "Child" : "الطفل", (f.name || "").trim()], [t.branch, branchLabel], [t.month, latest ? monthLabel(latest.month, lang) : ""]]} />,
  });

  if (p.rows.length < 2) {
    blocks.push({ key: "need", el: (<div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 16px", fontSize: 15 }}>{t.needMore}</div>) });
  }

  const cols = p.rows;
  const cell = { flex: 1, textAlign: "center", fontSize: 14 };
  blocks.push({
    key: "matrix",
    el: (
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ fontSize: 17, fontWeight: 800, padding: "10px 14px 6px" }}>{t.matrixT}</div>
        <div style={{ display: "flex", background: "#ede9fe", fontWeight: 800, fontSize: 13, padding: "6px 14px" }}>
          <div style={{ flex: 2.2 }} />
          {cols.map((c) => (<div key={c.month} style={cell}>{monthLabel(c.month, lang, true)}</div>))}
          <div style={{ ...cell, flex: 0.9 }}>{t.change}</div>
        </div>
        {[...DOMAINS.map((d) => ({ id: d.id, label: `${d.icon} ${name(d)}`, get: (c) => c.dom[d.id] || 0, change: p.domChange[d.id] })),
          { id: "all", label: t.overall, get: (c) => c.overall, change: { now: latest?.overall, prev: p.prev?.overall, t: p.overallT }, bold: true }].map((r, i) => {
          const [a, c] = arrow(r.change?.t);
          return (
            <div key={r.id} style={{ display: "flex", alignItems: "center", padding: "7px 14px", borderTop: "1px solid #f1f5f9", background: r.bold ? "#faf5ff" : i % 2 ? "#f8fafc" : "#fff", fontWeight: r.bold ? 800 : 400 }}>
              <div style={{ flex: 2.2, fontSize: 14, fontWeight: 700 }}>{r.label}</div>
              {cols.map((col) => {
                const v = r.get(col);
                const lv = v ? levelOf(v) : null;
                return (<div key={col.month} style={{ ...cell, color: lv ? lv.color : "#cbd5e1", fontWeight: 800 }}>{v ? f1(v) : "—"}</div>);
              })}
              <div style={{ ...cell, flex: 0.9, fontWeight: 800 }}><Chg a={a} c={c} v={r.change?.prev ? sgn(r.change.now - r.change.prev) : ""} /></div>
            </div>
          );
        })}
      </div>
    ),
  });

  const list = (title, items, color, bg, showFrom) => items.length > 0 && {
    key: "l-" + title,
    el: (
      <div style={{ border: `1px solid ${color}55`, background: bg, borderRadius: 12, padding: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color, marginBottom: 6 }}>{title} ({items.length})</div>
        {items.map((it) => (
          <div key={it.id} style={{ fontSize: 14.5, lineHeight: 1.9, borderTop: "1px dashed #cbd5e1", padding: "3px 0" }}>
            <b>{sk(it.id)}</b>
            {showFrom && it.prev ? <span style={{ color: "#475569" }}> — {t.from} {lbl(it.prev)} {t.to} <b style={{ color }}>{lbl(it.now)}</b></span> : <span style={{ color: "#475569" }}> — {lbl(it.now)}</span>}
          </div>
        ))}
      </div>
    ),
  };
  [
    list(t.improvedT, p.improved, "#059669", "#ecfdf5", true),
    list(t.stillT, p.persistent, "#b91c1c", "#fef2f2", true),
    list(t.newT, p.newLow, "#b45309", "#fffbeb", false),
    list(t.declinedT, p.declined, "#dc2626", "#fef2f2", true),
  ].filter(Boolean).forEach((b) => blocks.push(b));

  blocks.push({ key: "sig", el: <SigBlock t={t} /> });
  return blocks;
}
