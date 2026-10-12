// Monthly parent-partnership report (SPEA indicators 2.4 / 4.3): survey results,
// complaints/feedback log and communication KPIs. AR + EN, built as whole blocks.
import { SURVEY_SECTIONS, surveyQuestionById, TARGETS, kindOf, categoryOf, statusOf } from "./feedbackBank";
import { quarterLabel, meets, workingDaysBetween } from "./partnership";
import { monthLabel } from "./progress";

const PT = {
  ar: {
    group: "مجموعة رعاية الطفل للحضانات", title: "تقرير شراكة الأهل الشهري",
    ref: "مؤشرات إطار الشارقة: 2.4 العلاقة مع أولياء الأمور · 4.3 الشراكة مع الأهل والمجتمع",
    branch: "الفرع", month: "الشهر", survey: "الاستبيان ربع السنوي",
    kpis: "المؤشرات الرئيسية", target: "الهدف",
    respRate: "نسبة الرد على الاستبيان", satisf: "نسبة رضا الأهل", nps: "مؤشر التوصية (NPS)", sentRate: "تقارير النمو المرسلة للأهل",
    cReceived: "ملاحظات هذا الشهر", cAck: "تم الرد خلال 24 ساعة", cRes: "تم الحل خلال 5 أيام عمل", cAvg: "متوسط أيام الحل", overdue: "ملاحظات متأخرة الآن",
    days: "يوم", responses: "ردّاً", of: "من",
    bySection: "رضا الأهل حسب المحور", change: "التغيّر عن الربع السابق", satisfiedLbl: "راضٍ (4-5)", avg: "المتوسط",
    strengths: "أقوى 3 بنود", improve: "أضعف 3 بنود (أولوية التحسين)",
    commentsPos: "ما يعجب الأهل", commentsImp: "ما يقترح الأهل تحسينه", noSurvey: "لا توجد ردود استبيان لهذه الفترة بعد.", noComments: "لا توجد تعليقات.",
    casesT: "سجل الشكاوى والملاحظات لهذا الشهر", ref2: "المرجع", date: "التاريخ", type: "النوع", cat: "التصنيف", status: "الحالة", took: "أيام الحل",
    confidential: "🔒 سري", noCases: "لا توجد ملاحظات أو شكاوى مسجّلة هذا الشهر.", byCat: "التوزيع حسب التصنيف:",
    ysw: "قلتم... وفعلنا", yswEmpty: "(لم تُسجَّل إجراءات بعد)", sigMgr: "توقيع مديرة الفرع", sigDate: "التاريخ",
    parentOf: "ولي أمر", anon: "ولي أمر (مجهول)", open: "مفتوحة",
  },
  en: {
    group: "Child Care Nurseries Group", title: "Monthly Parent Partnership Report",
    ref: "Sharjah framework indicators: 2.4 Relationship with parents · 4.3 Partnerships with parents and community",
    branch: "Branch", month: "Month", survey: "Quarterly survey",
    kpis: "Key indicators", target: "Target",
    respRate: "Survey response rate", satisf: "Parent satisfaction", nps: "Net Promoter Score", sentRate: "Development reports sent to parents",
    cReceived: "Feedback this month", cAck: "Replied within 24 hours", cRes: "Resolved within 5 working days", cAvg: "Average days to resolve", overdue: "Overdue now",
    days: "days", responses: "responses", of: "of",
    bySection: "Parent satisfaction by area", change: "Change vs previous quarter", satisfiedLbl: "Satisfied (4-5)", avg: "Average",
    strengths: "Top 3 strengths", improve: "Lowest 3 items (improvement priorities)",
    commentsPos: "What parents like", commentsImp: "What parents suggest improving", noSurvey: "No survey responses for this period yet.", noComments: "No comments.",
    casesT: "Complaints & feedback log this month", ref2: "Ref", date: "Date", type: "Type", cat: "Category", status: "Status", took: "Days to resolve",
    confidential: "🔒 Confidential", noCases: "No feedback or complaints recorded this month.", byCat: "By category:",
    ysw: "You said... we did", yswEmpty: "(no actions recorded yet)", sigMgr: "Branch manager's signature", sigDate: "Date",
    parentOf: "Parent of", anon: "Parent (anonymous)", open: "Open",
  },
};

const col = (ok) => (ok === null || ok === undefined ? "#64748b" : ok ? "#059669" : "#d97706");
const fmt = (v, suffix = "") => (v === null || v === undefined ? "—" : `${v}${suffix}`);

export function buildPartnershipBlocks({ lang, branchLabel, month, period, survey, prevSurvey, cases, comms, note, firstNameOf }) {
  const en = lang === "en";
  const t = PT[en ? "en" : "ar"];
  const blocks = [];
  const chunk = (arr, n) => { const o = []; for (let i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; };
  const qText = (id) => { const q = surveyQuestionById[id]; return q ? (en ? q.en : q.ar) : id; };

  blocks.push({
    key: "head",
    el: (
      <div style={{ borderBottom: "3px solid #0d9488", paddingBottom: 10 }}>
        <div style={{ fontSize: 14, color: "#64748b" }}>{t.group}</div>
        <div style={{ fontSize: 27, fontWeight: 800, color: "#115e59" }}>{t.title}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {[[t.branch, branchLabel], [t.month, monthLabel(month, lang)], [t.survey, period ? quarterLabel(period, lang) : "—"]].map(([k, v]) => (
            <div key={k} style={{ flex: "1 1 170px", background: "#f0fdfa", border: "1px solid #99f6e4", borderRadius: 10, padding: "6px 12px" }}>
              <div style={{ fontSize: 12, color: "#0f766e", fontWeight: 700 }}>{k}</div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 8 }}>{t.ref}</div>
      </div>
    ),
  });

  const cs = cases;
  const kpi = (label, value, target, ok, sub) => (
    <div key={label} style={{ flex: "1 1 30%", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: col(ok) }}>{value}</div>
      <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11.5, color: "#64748b" }}>{sub}</div>}
      {target && <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{t.target}: {target}</div>}
    </div>
  );
  blocks.push({
    key: "kpi",
    el: (
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>{t.kpis}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {kpi(t.respRate, fmt(survey.responseRate, "%"), `${TARGETS.response}%+`, meets(survey.responseRate, TARGETS.response), `${survey.n} ${t.of} ${survey.eligible}`)}
          {kpi(t.satisf, fmt(survey.satisfaction, "%"), `${TARGETS.satisfaction}%+`, meets(survey.satisfaction, TARGETS.satisfaction), prevSurvey?.satisfaction !== null && prevSurvey?.satisfaction !== undefined && survey.satisfaction !== null ? `${survey.satisfaction - prevSurvey.satisfaction >= 0 ? "+" : ""}${survey.satisfaction - prevSurvey.satisfaction} ${t.change}` : "")}
          {kpi(t.nps, fmt(survey.nps), `${TARGETS.nps}+`, meets(survey.nps, TARGETS.nps))}
          {kpi(t.sentRate, fmt(comms.sentRate, "%"), `${TARGETS.reportsSent}%+`, meets(comms.sentRate, TARGETS.reportsSent), `${comms.sent} ${t.of} ${comms.kids}`)}
          {kpi(t.cAck, fmt(cs.ackRate, "%"), `${TARGETS.resolveRate}%+`, meets(cs.ackRate, TARGETS.resolveRate), `${cs.total} ${t.cReceived}`)}
          {kpi(t.cRes, fmt(cs.resolveRate, "%"), `${TARGETS.resolveRate}%+`, meets(cs.resolveRate, TARGETS.resolveRate), cs.avgResolveDays !== null ? `${t.cAvg}: ${cs.avgResolveDays.toFixed(1)} ${t.days}` : "")}
        </div>
        {cs.overdue > 0 && <div style={{ marginTop: 8, fontSize: 13.5, color: "#b45309", fontWeight: 700 }}>⏰ {t.overdue}: {cs.overdue}</div>}
      </div>
    ),
  });

  if (survey.n === 0) {
    blocks.push({ key: "nosurvey", el: (<div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 16px", fontSize: 14.5 }}>{t.noSurvey}</div>) });
  } else {
    blocks.push({
      key: "sections",
      el: (
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>{t.bySection}</div>
          {SURVEY_SECTIONS.map((sec) => {
            const cur = survey.perSection.find((x) => x.id === sec.id);
            const prev = prevSurvey?.perSection?.find((x) => x.id === sec.id);
            const d = cur?.satisfied !== null && prev?.satisfied !== null && prev?.satisfied !== undefined ? cur.satisfied - prev.satisfied : null;
            return (
              <div key={sec.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 230, fontSize: 14, fontWeight: 700 }}>{sec.icon} {en ? sec.en : sec.ar}</div>
                <div dir="ltr" style={{ flex: 1, height: 14, borderRadius: 7, background: "#e2e8f0", overflow: "hidden" }}>
                  <div style={{ width: `${cur?.satisfied || 0}%`, height: "100%", background: (cur?.satisfied || 0) >= TARGETS.satisfaction ? "#10b981" : (cur?.satisfied || 0) >= 70 ? "#f59e0b" : "#ef4444" }} />
                </div>
                <div style={{ width: 52, textAlign: "center", fontWeight: 800, fontSize: 14 }}>{fmt(cur?.satisfied, "%")}</div>
                <div dir="ltr" style={{ width: 50, textAlign: "center", fontSize: 12.5, color: d === null ? "#94a3b8" : d >= 0 ? "#059669" : "#dc2626", fontWeight: 700 }}>{d === null ? "—" : `${d >= 0 ? "▲ +" : "▼ "}${d}`}</div>
              </div>
            );
          })}
          <div style={{ fontSize: 12, color: "#94a3b8" }}>{t.satisfiedLbl} · {t.change}</div>
        </div>
      ),
    });

    const answered = survey.perQ.filter((q) => q.n > 0 && q.satisfied !== null);
    const best = [...answered].sort((a, b) => b.satisfied - a.satisfied || b.avg - a.avg).slice(0, 3);
    const worst = [...answered].sort((a, b) => a.satisfied - b.satisfied || a.avg - b.avg).slice(0, 3);
    const qBox = (title, items, color, bg, bd) => (
      <div style={{ flex: 1, border: `1px solid ${bd}`, background: bg, borderRadius: 12, padding: 12 }}>
        <div style={{ fontSize: 15.5, fontWeight: 800, color, marginBottom: 6 }}>{title}</div>
        {items.map((q) => (
          <div key={q.id} style={{ fontSize: 13.5, lineHeight: 1.7, borderTop: "1px dashed #cbd5e1", padding: "4px 0", display: "flex", gap: 8, justifyContent: "space-between" }}>
            <span>{qText(q.id)}</span><b style={{ color }}>{q.satisfied}%</b>
          </div>
        ))}
      </div>
    );
    blocks.push({ key: "bw", el: (<div style={{ display: "flex", gap: 12 }}>{qBox(t.strengths, best, "#047857", "#ecfdf5", "#a7f3d0")}{qBox(t.improve, worst, "#b45309", "#fffbeb", "#fde68a")}</div>) });

    const who = (r) => (r.anonymous ? t.anon : `${t.parentOf} ${firstNameOf(r.registration_id)}`.trim());
    const cm = (title, rows, color) => (
      <div style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
        <div style={{ fontSize: 15.5, fontWeight: 800, color, marginBottom: 6 }}>{title}</div>
        {rows.length === 0 && <div style={{ fontSize: 13.5, color: "#94a3b8" }}>{t.noComments}</div>}
        {rows.slice(0, 4).map((r, i) => (
          <div key={i} style={{ fontSize: 13.5, lineHeight: 1.7, borderTop: i ? "1px dashed #e2e8f0" : "none", padding: "4px 0" }}>
            “{(r._text || "").slice(0, 220)}” <span style={{ color: "#94a3b8", fontSize: 12 }}>— {who(r)}</span>
          </div>
        ))}
      </div>
    );
    blocks.push({
      key: "comments",
      el: (<div style={{ display: "flex", gap: 12 }}>
        {cm(t.commentsPos, survey.positive.map((r) => ({ ...r, _text: r.positive })), "#047857")}
        {cm(t.commentsImp, survey.improve.map((r) => ({ ...r, _text: r.improve })), "#b45309")}
      </div>),
    });
  }

  // complaints table
  if (cs.list.length === 0) {
    blocks.push({ key: "nocases", el: (<div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 16px", fontSize: 14.5 }}>{t.noCases}</div>) });
  } else {
    chunk(cs.list, 9).forEach((rows, ci) => {
      blocks.push({
        key: "cases" + ci,
        el: (
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            {ci === 0 && <div style={{ fontSize: 17, fontWeight: 800, padding: "10px 14px 4px" }}>{t.casesT} ({cs.list.length})</div>}
            {ci === 0 && Object.keys(cs.byCategory).length > 0 && (
              <div style={{ fontSize: 13, color: "#475569", padding: "0 14px 6px" }}>{t.byCat} {Object.entries(cs.byCategory).map(([k, n]) => `${en ? categoryOf(k).en : categoryOf(k).ar} (${n})`).join(en ? ", " : "، ")}</div>
            )}
            <div style={{ display: "flex", background: "#ccfbf1", fontSize: 12.5, fontWeight: 800, padding: "6px 14px" }}>
              <div style={{ flex: 1.2 }}>{t.ref2}</div><div style={{ flex: 1 }}>{t.date}</div><div style={{ flex: 2.2 }}>{t.type} / {t.cat}</div><div style={{ flex: 1.2 }}>{t.status}</div><div style={{ flex: 0.8, textAlign: "center" }}>{t.took}</div>
            </div>
            {rows.map((c, i) => {
              const st = statusOf(c.status);
              const k = kindOf(c.kind);
              return (
                <div key={c.id} style={{ display: "flex", alignItems: "center", fontSize: 13, padding: "6px 14px", background: i % 2 ? "#f8fafc" : "#fff", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ flex: 1.2, color: "#475569", paddingInlineEnd: 8 }}><span dir="ltr" style={{ unicodeBidi: "isolate", display: "inline-block" }}>{c.ref}</span></div>
                  <div style={{ flex: 1 }}>{new Date(c.received_at).toLocaleDateString(en ? "en-GB" : "ar-AE")}</div>
                  <div style={{ flex: 2.2 }}>{k.icon} {en ? k.en : k.ar} · {c.sensitive ? t.confidential : (en ? categoryOf(c.category).en : categoryOf(c.category).ar)}</div>
                  <div style={{ flex: 1.2, fontWeight: 800, color: st.color }}>{en ? st.en : st.ar}</div>
                  <div style={{ flex: 0.8, textAlign: "center" }}>{c.resolved_at ? workingDaysBetween(c.received_at, c.resolved_at) : "—"}</div>
                </div>
              );
            })}
            <div style={{ height: 6 }} />
          </div>
        ),
      });
    });
  }

  blocks.push({
    key: "ysw",
    el: (
      <div style={{ border: "1px solid #99f6e4", background: "#f0fdfa", borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#115e59", marginBottom: 6 }}>💬 {t.ysw}</div>
        <div style={{ fontSize: 14.5, lineHeight: 1.9, whiteSpace: "pre-wrap", color: note ? "#0f172a" : "#94a3b8" }}>{note || t.yswEmpty}</div>
      </div>
    ),
  });

  blocks.push({
    key: "sig",
    el: (
      <div style={{ display: "flex", gap: 24, marginTop: 14, fontSize: 14 }}>
        {[t.sigMgr, t.sigDate].map((x, i) => (
          <div key={x} style={{ flex: i === 0 ? 1.6 : 1 }}>
            <div style={{ height: 34, borderBottom: "1.5px solid #475569" }} />
            <div style={{ marginTop: 4, color: "#475569" }}>{x}</div>
          </div>
        ))}
      </div>
    ),
  });
  return blocks;
}
