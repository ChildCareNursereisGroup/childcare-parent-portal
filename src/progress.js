// Month-to-month progress logic for the monthly development evaluations.
// Domain averages (1-5) are comparable across age stages; individual skills are only
// compared when the same skill was rated in both months.
import { DOMAINS, LEVELS, AGE_BANDS, skillById, domainAverage, skillsFor, staffTip, parentTip } from "./devBank";

const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const EN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const EN_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthLabel(month, lang, short = false) {
  const [y, m] = String(month).split("-").map(Number);
  if (!y || !m) return String(month);
  if (lang === "en") return `${(short ? EN_SHORT : EN_MONTHS)[m - 1]} ${y}`;
  return `${AR_MONTHS[m - 1]} ${y}`;
}

// +1 improved, -1 declined, 0 about the same, null if either side is missing.
export const trendOf = (now, prev) => (!now || !prev ? null : now - prev >= 0.25 ? 1 : now - prev <= -0.25 ? -1 : 0);

export function summarize(ev) {
  const ratings = ev?.ratings || {};
  const dom = {};
  for (const d of DOMAINS) {
    const a = domainAverage(ratings, d.id);
    if (a) dom[d.id] = a;
  }
  const vals = Object.values(ratings).filter((v) => v > 0);
  const overall = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const low = Object.entries(ratings).filter(([, v]) => v > 0 && v <= 2).map(([id]) => id);
  return { month: ev?.month, band: ev?.age_band, ratings, dom, overall, low };
}

const sortedUpTo = (evals, month) => [...(evals || [])].filter((e) => !month || e.month <= month).sort((a, b) => a.month.localeCompare(b.month));

// One child: the last `maxMonths` evaluations up to `month`, plus changes since the previous one.
export function childProgress(evals, month, maxMonths = 6) {
  const list = sortedUpTo(evals, month).slice(-maxMonths).map(summarize);
  const latest = list[list.length - 1] || null;
  const prev = list.length > 1 ? list[list.length - 2] : null;
  const domChange = {};
  for (const d of DOMAINS) domChange[d.id] = { now: latest?.dom[d.id] || 0, prev: prev?.dom[d.id] || 0, t: trendOf(latest?.dom[d.id], prev?.dom[d.id]) };
  const improved = [], declined = [], persistent = [], newLow = [];
  if (latest) {
    for (const [id, v] of Object.entries(latest.ratings)) {
      if (!(v > 0) || !skillById(id)) continue;
      const pv = prev?.ratings?.[id];
      if (v <= 2) (pv && pv <= 2 ? persistent : newLow).push({ id, now: v, prev: pv || 0 });
      if (pv > 0) {
        if (v > pv) improved.push({ id, now: v, prev: pv });
        else if (v < pv) declined.push({ id, now: v, prev: pv });
      }
    }
  }
  return { rows: list, latest, prev, overallT: trendOf(latest?.overall, prev?.overall), domChange, improved, declined, persistent, newLow };
}

// Whole branch for one month.
export function branchSummary({ regs, evals, month }) {
  const kids = (regs || []).filter((r) => r.status === "approved");
  const byReg = {};
  for (const e of evals || []) (byReg[e.registration_id] ||= []).push(e);

  const rows = [];
  const missing = [];
  for (const r of kids) {
    const name = (r.form_data?.name || "").trim() || "—";
    const own = byReg[r.id] || [];
    if (!own.some((e) => e.month === month)) { missing.push({ id: r.id, name }); continue; }
    const p = childProgress(own, month, 6);
    rows.push({ id: r.id, reg: r, name, classId: r.class_id, p, now: p.latest, prev: p.prev, t: p.overallT, lowCount: p.latest.low.length, persistentCount: p.persistent.length });
  }
  rows.sort((a, b) => a.name.localeCompare(b.name, "ar"));

  const domains = DOMAINS.map((d) => {
    const vals = rows.filter((x) => x.now.dom[d.id]).map((x) => ({ now: x.now.dom[d.id], prev: x.prev?.dom[d.id] || 0 }));
    const n = vals.length;
    const avg = n ? vals.reduce((a, b) => a + b.now, 0) / n : 0;
    const both = vals.filter((v) => v.prev);
    const change = both.length ? both.reduce((a, b) => a + (b.now - b.prev), 0) / both.length : null;
    const onTrack = vals.filter((v) => v.now >= 3.5).length;
    const progressing = vals.filter((v) => v.now >= 2.5 && v.now < 3.5).length;
    const support = vals.filter((v) => v.now < 2.5).length;
    return { id: d.id, ar: d.ar, en: d.en, icon: d.icon, n, avg, change, onTrack, progressing, support };
  });

  const withPrev = rows.filter((x) => x.t !== null);
  const improved = withPrev.filter((x) => x.t === 1).length;
  const declined = withPrev.filter((x) => x.t === -1).length;
  const same = withPrev.length - improved - declined;

  const supportKids = rows
    .filter((x) => x.lowCount > 0)
    .map((x) => {
      const doms = [...new Set(x.now.low.map((id) => skillById(id)?.domain).filter(Boolean))];
      return { id: x.id, name: x.name, count: x.lowCount, persistent: x.persistentCount, domains: doms };
    })
    .sort((a, b) => b.persistent - a.persistent || b.count - a.count);

  const rated = domains.filter((d) => d.n > 0);
  const lowestDomain = rated.length ? [...rated].sort((a, b) => a.avg - b.avg)[0] : null;
  const strongestDomain = rated.length ? [...rated].sort((a, b) => b.avg - a.avg)[0] : null;
  const overallAvg = rows.length ? rows.reduce((a, b) => a + b.now.overall, 0) / rows.length : 0;

  return { total: kids.length, evaluated: rows.length, missing, rows, domains, improved, same, declined, comparable: withPrev.length, supportKids, lowestDomain, strongestDomain, overallAvg };
}

// Level label/color for a 1-5 average (rounded).
export const levelOf = (avg) => LEVELS.find((l) => l.v === Math.min(5, Math.max(1, Math.round(avg)))) || LEVELS[0];

// Support-plan payload for one child's evaluation (used for single and all-children PDFs).
export function buildPlan({ f, ratings, band, teacherName, month, lang, skillsOfBand }) {
  const en = lang === "en";
  const sk = skillsOfBand || skillsFor(band);
  const items = [];
  for (const d of DOMAINS) {
    for (const s of sk[d.id] || []) {
      const lv = ratings?.[s.id];
      if (lv && lv <= 2) items.push({ s, d, lv });
    }
  }
  items.sort((a, b) => a.lv - b.lv);
  const bd = AGE_BANDS.find((x) => x.id === band);
  return {
    lang,
    childName: (f.name || "").trim(),
    monthLabel: monthLabel(month, lang),
    bandLabel: bd ? (en ? bd.en : bd.ar) : "",
    teacher: teacherName || "",
    items: items.map(({ s, d, lv }) => {
      const L = LEVELS.find((x) => x.v === lv);
      return {
        domain: en ? d.en : d.ar, skill: en ? s.en : s.ar, level: lv, levelLabel: en ? L.en : L.ar, color: L.color,
        staffTip: staffTip({ skillId: s.id, level: lv, gender: f.gender, lang }),
        parentTip: parentTip({ skillId: s.id, level: lv, gender: f.gender, lang }),
      };
    }),
  };
}
