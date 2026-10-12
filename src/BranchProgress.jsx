// Manager-facing month-to-month progress: branch screen + per-child comparison.
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { generateBranchProgressPdfBlob, generateChildProgressPdfBlob, generateAllPlansPdfBlob } from "./lib/pdfExport";
import { DOMAINS } from "./devBank";
import { branchSummary, childProgress, buildPlan, monthLabel, levelOf } from "./progress";

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

const f1 = (n) => (n ? n.toFixed(1) : "—");
const trendIcon = (t) => (t === 1 ? ["▲", "text-emerald-600"] : t === -1 ? ["▼", "text-rose-600"] : t === 0 ? ["●", "text-slate-400"] : ["", ""]);
const slug = (s) => String(s || "child").trim().replace(/\s+/g, "-");

function nowMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function PdfButtons({ tr, busy, onGo, label }) {
  return (
    <div className="flex gap-2">
      {["ar", "en"].map((L) => (
        <button key={L} type="button" disabled={!!busy} onClick={() => onGo(L)}
          className="flex-1 bg-sky-600 text-white font-bold py-2 rounded-xl text-[11px] disabled:opacity-60">
          {busy === L ? tr("جارِ التجهيز...", "Preparing...") : `📄 ${label} — ${L === "ar" ? tr("عربي", "Arabic") : "English"}`}
        </button>
      ))}
    </div>
  );
}

export function BranchReportScreen({ tr, session, regs, classes, branchLabel, onClose, showToast }) {
  const [evals, setEvals] = useState(null);
  const [month, setMonth] = useState(nowMonth());
  const [busy, setBusy] = useState("");
  const [busyPlans, setBusyPlans] = useState("");

  useEffect(() => {
    supabase.functions.invoke("branch-admin", { body: { action: "list_branch_evaluations", token: session.token } })
      .then(({ data, error }) => {
        if (error || data?.error) { showToast(tr("تعذّر تحميل التقييمات", "Could not load evaluations")); setEvals([]); return; }
        const list = data.evaluations || [];
        setEvals(list);
        // open on the latest month that has data when the current month is still empty
        if (list.length && !list.some((e) => e.month === nowMonth())) setMonth(list[list.length - 1].month);
      });
  }, []);

  const classNameById = Object.fromEntries((classes || []).map((c) => [c.id, c.name]));
  const s = evals ? branchSummary({ regs, evals, month }) : null;
  const regById = Object.fromEntries((regs || []).map((r) => [r.id, r]));

  const makeProgress = async (L) => {
    setBusy(L);
    try {
      const blob = await generateBranchProgressPdfBlob({ summary: s, month, lang: L, branchLabel: branchLabel[L], classNameById });
      downloadBlob(blob, `Branch-Progress-${month}-${L === "en" ? "EN" : "AR"}.pdf`);
    } catch (_e) { showToast(tr("حصل خطأ في عمل الملف", "Could not create the PDF")); }
    setBusy("");
  };

  const makePlans = async (L) => {
    setBusyPlans(L);
    try {
      const plans = s.rows
        .filter((r) => r.lowCount > 0)
        .map((r) => {
          const ev = evals.find((e) => e.registration_id === r.id && e.month === month);
          return buildPlan({ f: regById[r.id]?.form_data || {}, ratings: ev.ratings, band: ev.age_band || "C", teacherName: ev.teacher_name, month, lang: L });
        });
      const blob = await generateAllPlansPdfBlob({ plans, lang: L, branchLabel: branchLabel[L], emptyText: L === "en" ? "No child needs a support plan this month." : "لا يوجد أطفال يحتاجون خطة دعم هذا الشهر." });
      downloadBlob(blob, `Support-Plans-${month}-${L === "en" ? "EN" : "AR"}.pdf`);
    } catch (_e) { showToast(tr("حصل خطأ في عمل الملف", "Could not create the PDF")); }
    setBusyPlans("");
  };

  const dn = (d) => tr(d.ar, d.en);

  return (
    <div className="absolute inset-0 z-20 bg-slate-50 flex flex-col">
      <div className="flex items-center justify-between px-4 pt-5 pb-3 bg-white border-b border-slate-100">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>
        <p className="font-extrabold text-slate-800 text-sm">{tr("📊 تقرير نمو الفرع الشهري", "📊 Branch monthly progress")}</p>
        <span className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-right">
        <div className="flex items-center justify-between">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-800" />
          <p className="text-[11px] text-slate-500">{tr("مقارنة بآخر تقييم سابق لكل طفل", "Compared with each child's previous evaluation")}</p>
        </div>

        {!s && <p className="text-xs text-slate-400 text-center">{tr("جارِ التحميل...", "Loading...")}</p>}

        {s && (
          <>
            <div className="grid grid-cols-3 gap-2">
              {[
                [tr("تم تقييمهم", "Evaluated"), `${s.evaluated}/${s.total}`, "text-sky-700"],
                [tr("تحسّنوا", "Improved"), s.improved, "text-emerald-600"],
                [tr("ثابتون", "Steady"), s.same, "text-slate-500"],
                [tr("تراجعوا", "Declined"), s.declined, "text-rose-600"],
                [tr("يحتاجون دعماً", "Need support"), s.supportKids.length, "text-amber-600"],
                [tr("متوسط الفرع", "Branch avg"), f1(s.overallAvg), "text-sky-700"],
              ].map(([k, v, c]) => (
                <div key={k} className="bg-white rounded-2xl p-2.5 border border-slate-100 text-center">
                  <p className={`text-lg font-extrabold ${c}`}>{v}</p>
                  <p className="text-[10.5px] font-bold text-slate-500">{k}</p>
                </div>
              ))}
            </div>
            {s.evaluated > 0 && s.comparable === 0 && <p className="text-[11px] text-slate-400">{tr("لا توجد بيانات شهر سابق للمقارنة بعد — هتظهر المقارنة من التقييم التاني.", "No earlier evaluation to compare yet — comparison appears from the second evaluation.")}</p>}

            {s.evaluated === 0 ? (
              <p className="text-xs text-slate-500 bg-white rounded-2xl p-4 border border-slate-100 text-center">{tr("لا توجد تقييمات لهذا الشهر بعد.", "No evaluations for this month yet.")}</p>
            ) : (
              <>
                <div className="bg-white rounded-2xl p-3 border border-slate-100 space-y-2.5">
                  <p className="text-xs font-bold text-slate-700">{tr("أداء الأطفال حسب المجال", "Performance by domain")}</p>
                  {s.domains.map((d) => {
                    const pct = (x) => (d.n ? (x / d.n) * 100 : 0);
                    const t = d.change === null ? null : d.change >= 0.25 ? 1 : d.change <= -0.25 ? -1 : 0;
                    const [ic, col] = trendIcon(t);
                    return (
                      <div key={d.id}>
                        <div className="flex justify-between text-[11px] mb-0.5">
                          <span className="font-bold text-slate-700">{f1(d.avg)} <span dir="ltr" className={col} style={{ unicodeBidi: "isolate", display: "inline-block" }}>{ic} {d.change !== null ? (d.change > 0.05 ? "+" : "") + d.change.toFixed(1) : ""}</span></span>
                          <span className="text-slate-600">{d.icon} {dn(d)}</span>
                        </div>
                        <div dir="ltr" className="flex h-2.5 rounded-full overflow-hidden bg-slate-200">
                          <div style={{ width: `${pct(d.onTrack)}%` }} className="bg-emerald-500" />
                          <div style={{ width: `${pct(d.progressing)}%` }} className="bg-amber-400" />
                          <div style={{ width: `${pct(d.support)}%` }} className="bg-rose-500" />
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-[10px] text-slate-400">{tr("🟩 على المستوى المتوقع · 🟨 في تقدّم · 🟥 يحتاج دعماً", "🟩 On track · 🟨 Progressing · 🟥 Needs support")}</p>
                </div>

                <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200">
                  <p className="text-xs font-bold text-amber-800 mb-1">{tr(`أطفال يحتاجون دعماً (${s.supportKids.length})`, `Children needing support (${s.supportKids.length})`)}</p>
                  {s.supportKids.length === 0 && <p className="text-[11px] text-emerald-700">{tr("لا يوجد 🎉", "None 🎉")}</p>}
                  {s.supportKids.map((k) => (
                    <p key={k.id} className="text-[11px] text-slate-700 border-t border-amber-100 py-1">
                      <b>{k.name}</b> — {k.count} {tr("مهارة", "skills")} {k.persistent > 0 && <span className="text-rose-600 font-bold">⚠ {tr("مستمر", "ongoing")} ({k.persistent})</span>}
                      <br /><span className="text-slate-500">{k.domains.map((id) => { const d = DOMAINS.find((x) => x.id === id); return d ? dn(d) : id; }).join(tr("، ", ", "))}</span>
                    </p>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="flex text-[10.5px] font-bold bg-sky-50 text-sky-800 px-3 py-1.5">
                    <span className="flex-[2]">{tr("الطفل", "Child")}</span><span className="flex-1 text-center">{tr("السابق", "Prev")}</span><span className="flex-1 text-center">{tr("الحالي", "Now")}</span><span className="flex-1 text-center">{tr("التغيّر", "Change")}</span>
                  </div>
                  {s.rows.map((r) => {
                    const [ic, col] = trendIcon(r.t);
                    return (
                      <div key={r.id} className="flex text-[11px] px-3 py-1.5 border-t border-slate-50 items-center">
                        <span className="flex-[2] font-bold text-slate-700">{r.name}</span>
                        <span className="flex-1 text-center text-slate-400">{r.prev ? f1(r.prev.overall) : "—"}</span>
                        <span className="flex-1 text-center font-bold" style={{ color: levelOf(r.now.overall).color }}>{f1(r.now.overall)}</span>
                        <span dir="ltr" style={{ unicodeBidi: "isolate" }} className={`flex-1 text-center font-bold ${col}`}>{ic} {r.prev ? (r.now.overall - r.prev.overall > 0.05 ? "+" : "") + (r.now.overall - r.prev.overall).toFixed(1) : ""}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {s.missing.length > 0 && (
              <div className="bg-white rounded-2xl p-3 border border-slate-100">
                <p className="text-xs font-bold text-slate-700 mb-1">{tr(`⏳ لسه ما اتقيّموش (${s.missing.length})`, `⏳ Not evaluated yet (${s.missing.length})`)}</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">{s.missing.map((m) => m.name).join(tr("، ", ", "))}</p>
              </div>
            )}

            {s.evaluated > 0 && (
              <div className="bg-white rounded-2xl p-3 border border-slate-100 space-y-2">
                <p className="text-xs font-bold text-slate-700">{tr("ملفات للطباعة (PDF)", "Printable files (PDF)")}</p>
                <PdfButtons tr={tr} busy={busy} onGo={makeProgress} label={tr("تقرير مقارنة الفرع", "Branch progress report")} />
                <PdfButtons tr={tr} busy={busyPlans} onGo={makePlans} label={tr("خطط الدعم لكل الأطفال", "All support plans")} />
                <p className="text-[10px] text-slate-400">{tr("خطة الدعم بتشمل بس الأطفال اللي عندهم مهارة في المستوى 1 أو 2، وكل طفل في صفحة جديدة.", "Support plans include only children with a skill at level 1 or 2, one child per page.")}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Shown inside the child's evaluation section.
export function ChildProgressSection({ tr, reg, evaluations, month, branchLabel, showToast }) {
  const f = reg.form_data || {};
  const [busy, setBusy] = useState("");
  const p = childProgress(evaluations, month, 6);
  if (!p.latest) return null;

  const go = async (L) => {
    setBusy(L);
    try {
      const blob = await generateChildProgressPdfBlob({ p, f, lang: L, branchLabel: branchLabel?.[L] || "" });
      downloadBlob(blob, `Progress-${slug(f.name)}-${month}-${L === "en" ? "EN" : "AR"}.pdf`);
    } catch (_e) { showToast(tr("حصل خطأ في عمل الملف", "Could not create the PDF")); }
    setBusy("");
  };

  return (
    <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 mt-3 text-right space-y-2">
      <p className="text-xs font-bold text-sky-800">{tr("📈 مقارنة نمو الطفل عبر الشهور", "📈 Progress across months")}</p>
      {p.rows.length < 2 ? (
        <p className="text-[11px] text-slate-500">{tr("محتاجين تقييمين على الأقل عشان تظهر المقارنة.", "At least two evaluations are needed for a comparison.")}</p>
      ) : (
        <div className="bg-white rounded-lg overflow-hidden border border-sky-100">
          <div className="flex text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-1">
            <span className="flex-[2]" />
            {p.rows.map((r) => (<span key={r.month} className="flex-1 text-center">{monthLabel(r.month, tr("ar", "en"), true)}</span>))}
          </div>
          {[...DOMAINS.map((d) => ({ id: d.id, label: `${d.icon} ${tr(d.ar, d.en)}`, get: (c) => c.dom[d.id] })), { id: "all", label: tr("المتوسط العام", "Overall"), get: (c) => c.overall }].map((row) => (
            <div key={row.id} className="flex text-[11px] px-2 py-1 border-t border-slate-50">
              <span className="flex-[2] text-slate-600 truncate">{row.label}</span>
              {p.rows.map((c) => (<span key={c.month} className="flex-1 text-center font-bold" style={{ color: row.get(c) ? levelOf(row.get(c)).color : "#cbd5e1" }}>{f1(row.get(c))}</span>))}
            </div>
          ))}
        </div>
      )}
      {(p.improved.length > 0 || p.persistent.length > 0) && (
        <p className="text-[11px] text-slate-600">
          {p.improved.length > 0 && <span className="text-emerald-700 font-bold">✅ {p.improved.length} {tr("مهارة تحسّنت", "skills improved")} </span>}
          {p.persistent.length > 0 && <span className="text-rose-600 font-bold">⚠ {p.persistent.length} {tr("لسه محتاجة دعم", "still need support")}</span>}
        </p>
      )}
      <PdfButtons tr={tr} busy={busy} onGo={go} label={tr("تقرير المقارنة", "Progress report")} />
    </div>
  );
}
