// Statistics for the parent-partnership report (survey + complaints + communication).
import { SURVEY_SECTIONS, SURVEY_QUESTIONS, TARGETS } from "./feedbackBank";

export function quarterOf(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
}
export const quarterOfMonth = (month) => { const [y, m] = month.split("-").map(Number); return `${y}-Q${Math.floor((m - 1) / 3) + 1}`; };
export function prevQuarter(q) { let [y, n] = q.split("-Q").map(Number); n -= 1; if (n < 1) { n = 4; y -= 1; } return `${y}-Q${n}`; }
export function quarterLabel(q, lang) {
  const [y, n] = q.split("-Q").map(Number);
  const months = lang === "en" ? ["Jan–Mar", "Apr–Jun", "Jul–Sep", "Oct–Dec"] : ["يناير–مارس", "أبريل–يونيو", "يوليو–سبتمبر", "أكتوبر–ديسمبر"];
  return `${lang === "en" ? "Q" : "الربع "}${n} ${y} (${months[n - 1]})`;
}
export const monthKey = (iso) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };

const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);

// Survey results for one period.
export function surveyStats({ surveys, period, eligible }) {
  const rows = (surveys || []).filter((s) => s.period === period);
  const n = rows.length;
  const perQ = SURVEY_QUESTIONS.map((q) => {
    const vals = rows.map((r) => r.answers?.[q.id]).filter((v) => v >= 1 && v <= 5);
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { id: q.id, section: q.section, n: vals.length, avg, satisfied: pct(vals.filter((v) => v >= 4).length, vals.length) };
  });
  const perSection = SURVEY_SECTIONS.map((s) => {
    const qs = perQ.filter((q) => q.section === s.id && q.n > 0);
    const allVals = rows.flatMap((r) => s.q.map(([id]) => r.answers?.[id]).filter((v) => v >= 1 && v <= 5));
    return { id: s.id, avg: allVals.length ? allVals.reduce((a, b) => a + b, 0) / allVals.length : 0, satisfied: pct(allVals.filter((v) => v >= 4).length, allVals.length), questions: qs.length };
  });
  const all = rows.flatMap((r) => Object.values(r.answers || {}).filter((v) => v >= 1 && v <= 5));
  const satisfaction = pct(all.filter((v) => v >= 4).length, all.length);
  const npsVals = rows.map((r) => r.nps).filter((v) => v !== null && v !== undefined);
  const nps = npsVals.length ? Math.round(((npsVals.filter((v) => v >= 9).length - npsVals.filter((v) => v <= 6).length) / npsVals.length) * 100) : null;
  return {
    period, n, eligible: eligible || 0, responseRate: pct(n, eligible), satisfaction, nps, perQ, perSection,
    positive: rows.filter((r) => (r.positive || "").trim()),
    improve: rows.filter((r) => (r.improve || "").trim()),
  };
}

// Working days (Mon–Fri) between two dates, excluding the start day.
export function workingDaysBetween(from, to) {
  const a = new Date(from); a.setHours(0, 0, 0, 0);
  const b = new Date(to); b.setHours(0, 0, 0, 0);
  let n = 0;
  for (const d = new Date(a); d < b;) { d.setDate(d.getDate() + 1); const w = d.getDay(); if (w !== 0 && w !== 6) n++; }
  return n;
}

// Complaint/feedback metrics for one calendar month (by received date), plus open backlog.
export function caseStats({ cases, month, now = new Date() }) {
  const all = cases || [];
  const inMonth = all.filter((c) => monthKey(c.received_at) === month);
  const complaints = inMonth.filter((c) => c.kind === "complaint");
  const ackHours = (c) => (c.acknowledged_at ? (new Date(c.acknowledged_at) - new Date(c.received_at)) / 36e5 : null);
  const ackOk = inMonth.filter((c) => c.acknowledged_at && ackHours(c) <= TARGETS.ackHours).length;
  const ackDone = inMonth.filter((c) => c.acknowledged_at).length;
  const resolved = inMonth.filter((c) => c.resolved_at);
  const resDays = resolved.map((c) => workingDaysBetween(c.received_at, c.resolved_at));
  const resOk = resDays.filter((d) => d <= TARGETS.resolveDays).length;
  const open = all.filter((c) => c.status !== "resolved");
  const overdue = open.filter((c) => (!c.acknowledged_at && (now - new Date(c.received_at)) / 36e5 > TARGETS.ackHours) || workingDaysBetween(c.received_at, now) > TARGETS.resolveDays);
  const byCategory = {};
  for (const c of inMonth) byCategory[c.category] = (byCategory[c.category] || 0) + 1;
  const satisfiedKnown = resolved.filter((c) => c.parent_satisfied !== null && c.parent_satisfied !== undefined);
  return {
    total: inMonth.length,
    complaints: complaints.length,
    suggestions: inMonth.filter((c) => c.kind === "suggestion").length,
    compliments: inMonth.filter((c) => c.kind === "compliment").length,
    resolved: resolved.length,
    avgResolveDays: resDays.length ? resDays.reduce((a, b) => a + b, 0) / resDays.length : null,
    ackRate: pct(ackOk, inMonth.length),
    ackDone,
    resolveRate: pct(resOk, resolved.length),
    satisfiedRate: pct(satisfiedKnown.filter((c) => c.parent_satisfied).length, satisfiedKnown.length),
    sensitive: inMonth.filter((c) => c.sensitive).length,
    byCategory,
    openCount: open.length,
    overdue: overdue.length,
    list: [...inMonth].sort((a, b) => new Date(a.received_at) - new Date(b.received_at)),
  };
}

// How well we keep parents informed: share of monthly reports emailed for the month.
export function commsStats({ regs, evals, month }) {
  const kids = (regs || []).filter((r) => r.status === "approved");
  const evs = (evals || []).filter((e) => e.month === month && kids.some((k) => k.id === e.registration_id));
  return { kids: kids.length, evaluated: evs.length, sent: evs.filter((e) => e.sent_at).length, sentRate: pct(evs.filter((e) => e.sent_at).length, kids.length) };
}

export const meets = (value, target, lowerBetter = false) => (value === null || value === undefined ? null : lowerBetter ? value <= target : value >= target);
