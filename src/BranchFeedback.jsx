// Manager-facing parent partnership screen: complaints log, quarterly survey results,
// and the monthly partnership report (PDF, Arabic + English).
import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { generatePartnershipPdfBlob } from "./lib/pdfExport";
import { downloadBlob } from "./BranchProgress";
import {
  SURVEY_SECTIONS, surveyQuestionById, CASE_KINDS, CASE_CATEGORIES, CASE_STATUSES, CASE_SOURCES,
  kindOf, categoryOf, statusOf, sourceOf, TARGETS,
} from "./feedbackBank";
import { quarterOf, quarterOfMonth, prevQuarter, quarterLabel, surveyStats, caseStats, commsStats, workingDaysBetween } from "./partnership";

const nowMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
const first = (n) => String(n || "").trim().split(" ")[0] || "";

function Chip({ label, active, onClick, color }) {
  return (
    <button type="button" onClick={onClick} className="text-[11px] font-bold px-2.5 py-1 rounded-full border"
      style={active ? { background: color || "#0ea5e9", color: "#fff", borderColor: color || "#0ea5e9" } : { background: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>{label}</button>
  );
}

export function PartnershipScreen({ tr, session, regs, branchLabel, onClose, showToast }) {
  const lang = tr("ar", "en");
  const [tab, setTab] = useState("cases");
  const [data, setData] = useState(null); // { cases, surveys, notes }
  const [evals, setEvals] = useState([]);

  const approved = (regs || []).filter((r) => r.status === "approved");
  const regById = Object.fromEntries((regs || []).map((r) => [r.id, r]));

  const load = async () => {
    const [a, b] = await Promise.all([
      supabase.functions.invoke("branch-admin", { body: { action: "list_feedback", token: session.token } }),
      supabase.functions.invoke("branch-admin", { body: { action: "list_branch_evaluations", token: session.token } }),
    ]);
    if (a.error || a.data?.error) { showToast(tr("تعذّر التحميل", "Could not load")); setData({ cases: [], surveys: [], notes: [] }); return; }
    setData(a.data);
    setEvals(b.data?.evaluations || []);
  };
  useEffect(() => { load(); }, []);

  const overdueCount = data ? caseStats({ cases: data.cases, month: nowMonth() }).overdue : 0;

  return (
    <div className="absolute inset-0 z-20 bg-slate-50 flex flex-col">
      <div className="flex items-center justify-between px-4 pt-5 pb-3 bg-white border-b border-slate-100">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>
        <p className="font-extrabold text-slate-800 text-sm">{tr("🤝 شراكة الأهل", "🤝 Parent partnership")}</p>
        <span className="w-8" />
      </div>
      <div className="flex bg-white border-b border-slate-100 text-[11.5px] font-bold">
        {[["cases", tr("الشكاوى", "Complaints") + (overdueCount ? ` ⏰${overdueCount}` : "")], ["survey", tr("الاستبيان", "Survey")], ["report", tr("التقرير الشهري", "Monthly report")]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`flex-1 py-2.5 ${tab === k ? "text-teal-700 border-b-2 border-teal-600" : "text-slate-400"}`}>{l}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 text-right">
        {!data && <p className="text-xs text-slate-400 text-center">{tr("جارِ التحميل...", "Loading...")}</p>}
        {data && tab === "cases" && <CasesTab tr={tr} lang={lang} token={session.token} data={data} approved={approved} onChanged={load} showToast={showToast} />}
        {data && tab === "survey" && <SurveyTab tr={tr} lang={lang} data={data} approved={approved} regById={regById} />}
        {data && tab === "report" && <ReportTab tr={tr} lang={lang} token={session.token} data={data} evals={evals} regs={regs} approved={approved} regById={regById} branchLabel={branchLabel} onChanged={load} showToast={showToast} />}
      </div>
    </div>
  );
}

// ---------------- Complaints ----------------
function CasesTab({ tr, lang, token, data, approved, onChanged, showToast }) {
  const [filter, setFilter] = useState("open");
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const now = new Date();
  const isOverdue = (c) => c.status !== "resolved" && ((!c.acknowledged_at && (now - new Date(c.received_at)) / 36e5 > TARGETS.ackHours) || workingDaysBetween(c.received_at, now) > TARGETS.resolveDays);
  const list = data.cases.filter((c) => (filter === "all" ? true : filter === "open" ? c.status !== "resolved" : isOverdue(c)));
  const sel = data.cases.find((c) => c.id === selectedId);
  const overdueN = data.cases.filter(isOverdue).length;

  return (
    <div className="space-y-2.5">
      <button onClick={() => setCreating(true)} className="w-full bg-teal-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1">
        <Plus className="w-4 h-4" /> {tr("تسجيل شكوى / ملاحظة (تليفون، واتساب، شخصياً)", "Log a complaint / feedback (phone, WhatsApp, in person)")}
      </button>
      <div className="flex gap-1.5 justify-end">
        <Chip label={tr("كل الحالات", "All")} active={filter === "all"} onClick={() => setFilter("all")} />
        <Chip label={tr("⏰ متأخرة", "⏰ Overdue") + ` (${overdueN})`} active={filter === "overdue"} color="#dc2626" onClick={() => setFilter("overdue")} />
        <Chip label={tr("المفتوحة", "Open")} active={filter === "open"} onClick={() => setFilter("open")} />
      </div>
      {list.length === 0 && <p className="text-xs text-slate-400 text-center py-6">{tr("لا توجد ملاحظات في هذا العرض.", "Nothing to show.")}</p>}
      {list.map((c) => {
        const st = statusOf(c.status);
        return (
          <button key={c.id} onClick={() => setSelectedId(c.id)} className="w-full bg-white rounded-2xl p-3 border border-slate-100 shadow-sm text-right">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: st.color }}>{tr(st.ar, st.en)}</span>
              <p className="text-sm font-bold text-slate-800 flex-1 truncate">{kindOf(c.kind).icon} {c.sensitive ? "🔒 " : ""}{c.subject}</p>
            </div>
            <p className="text-[10.5px] text-slate-400">
              {c.ref} · {tr(categoryOf(c.category).ar, categoryOf(c.category).en)} · {c.child_name || "—"} · {new Date(c.received_at).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-GB")}
              {isOverdue(c) && <span className="text-rose-600 font-bold"> · ⏰ {tr("متأخرة", "overdue")}</span>}
            </p>
          </button>
        );
      })}
      {creating && <NewCaseModal tr={tr} token={token} approved={approved} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); onChanged(); }} showToast={showToast} />}
      {sel && <CaseModal tr={tr} lang={lang} token={token} c={sel} onClose={() => setSelectedId(null)} onSaved={onChanged} showToast={showToast} />}
    </div>
  );
}

function NewCaseModal({ tr, token, approved, onClose, onSaved, showToast }) {
  const [f, setF] = useState({ source: "phone", kind: "complaint", category: "care", registration_id: "", parent_name: "", subject: "", description: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    if (!f.subject.trim()) { showToast(tr("اكتبي العنوان", "Add a title")); return; }
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("branch-admin", { body: { action: "save_case", token, ...f, registration_id: f.registration_id || null } });
    setSaving(false);
    if (error || data?.error) { showToast(tr("حصل خطأ في الحفظ", "Could not save")); return; }
    showToast(tr("تم تسجيل الملاحظة ✓", "Logged ✓"));
    onSaved();
  };
  return (
    <div className="absolute inset-0 z-30 bg-slate-900/60 flex items-end">
      <div className="bg-white w-full rounded-t-3xl p-4 space-y-2.5 max-h-[92%] overflow-y-auto">
        <div className="flex items-center justify-between"><button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button><p className="font-bold text-sm text-slate-800">{tr("تسجيل ملاحظة جديدة", "Log new feedback")}</p></div>
        <p className="text-[11px] font-bold text-slate-500">{tr("وصلت عن طريق", "Received via")}</p>
        <div className="flex flex-wrap gap-1.5 justify-end">{CASE_SOURCES.filter((s) => s.id !== "portal").map((s) => <Chip key={s.id} label={tr(s.ar, s.en)} active={f.source === s.id} onClick={() => set("source", s.id)} />)}</div>
        <div className="flex gap-1.5 justify-end">{CASE_KINDS.map((k) => <Chip key={k.id} label={`${k.icon} ${tr(k.ar, k.en)}`} active={f.kind === k.id} color="#e11d48" onClick={() => set("kind", k.id)} />)}</div>
        <div className="flex flex-wrap gap-1.5 justify-end">{CASE_CATEGORIES.map((c) => <Chip key={c.id} label={tr(c.ar, c.en) + (c.sensitive ? " 🔒" : "")} active={f.category === c.id} onClick={() => set("category", c.id)} />)}</div>
        <select value={f.registration_id} onChange={(e) => set("registration_id", e.target.value)} className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs bg-white text-slate-800">
          <option value="">{tr("— الطفل (اختياري) —", "— Child (optional) —")}</option>
          {[...approved].sort((a, b) => (a.form_data?.name || "").localeCompare(b.form_data?.name || "", "ar")).map((r) => <option key={r.id} value={r.id}>{r.form_data?.name}</option>)}
        </select>
        {!f.registration_id && <input value={f.parent_name} onChange={(e) => set("parent_name", e.target.value)} placeholder={tr("اسم ولي الأمر", "Parent's name")} className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs bg-white text-slate-800" />}
        <input value={f.subject} onChange={(e) => set("subject", e.target.value)} placeholder={tr("العنوان", "Title")} className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs bg-white text-slate-800" />
        <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder={tr("التفاصيل", "Details")} className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs bg-white text-slate-800" />
        <button onClick={save} disabled={saving} className="w-full bg-teal-600 text-white font-bold py-2.5 rounded-xl text-xs disabled:opacity-60">{saving ? tr("جارِ الحفظ...", "Saving...") : tr("حفظ", "Save")}</button>
      </div>
    </div>
  );
}

function CaseModal({ tr, lang, token, c, onClose, onSaved, showToast }) {
  const [status, setStatus] = useState(c.status);
  const [actionTaken, setActionTaken] = useState(c.action_taken || "");
  const [satisfied, setSatisfied] = useState(c.parent_satisfied);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    const { data, error } = await supabase.functions.invoke("branch-admin", { body: { action: "save_case", token, id: c.id, status, action_taken: actionTaken, parent_satisfied: satisfied } });
    setSaving(false);
    if (error || data?.error) { showToast(tr("حصل خطأ في الحفظ", "Could not save")); return; }
    showToast(data.notified ? tr("تم الحفظ وإبلاغ ولي الأمر بالإيميل ✓", "Saved and parent notified by email ✓") : tr("تم الحفظ ✓", "Saved ✓"));
    onSaved();
    onClose();
  };
  const fmt = (d) => (d ? new Date(d).toLocaleString(lang === "ar" ? "ar-AE" : "en-GB") : "—");
  return (
    <div className="absolute inset-0 z-30 bg-slate-900/60 flex items-end">
      <div className="bg-white w-full rounded-t-3xl p-4 space-y-2.5 max-h-[92%] overflow-y-auto text-right">
        <div className="flex items-center justify-between"><button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button><p className="font-bold text-sm text-slate-800">{kindOf(c.kind).icon} {c.ref}</p></div>
        {c.sensitive && <p className="text-[11px] bg-rose-50 text-rose-700 border border-rose-200 rounded-lg px-2 py-1.5">{tr("🔒 ملاحظة حساسة — بتظهر للمديرة وللإدارة العليا بس، وما بتتكتبش تفاصيلها في تقرير الأهل.", "🔒 Sensitive — visible to the branch manager and head office only; details are not printed in reports.")}</p>}
        <p className="text-sm font-bold text-slate-800">{c.subject}</p>
        <p className="text-[11px] text-slate-500">{tr(categoryOf(c.category).ar, categoryOf(c.category).en)} · {tr(sourceOf(c.source).ar, sourceOf(c.source).en)} · {c.child_name || "—"} · {c.parent_name || ""} {c.contact ? `(${c.contact})` : ""}</p>
        {c.description && <p className="text-xs text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-lg p-2">{c.description}</p>}
        <p className="text-[10.5px] text-slate-400">{tr("وصلت:", "Received:")} {fmt(c.received_at)} · {tr("أول رد:", "First reply:")} {fmt(c.acknowledged_at)} · {tr("تم الحل:", "Resolved:")} {fmt(c.resolved_at)}</p>
        <p className="text-[11px] font-bold text-slate-500">{tr("الحالة", "Status")}</p>
        <div className="flex flex-wrap gap-1.5 justify-end">{CASE_STATUSES.map((s) => <Chip key={s.id} label={tr(s.ar, s.en)} active={status === s.id} color={s.color} onClick={() => setStatus(s.id)} />)}</div>
        <textarea value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} rows={3} placeholder={tr("الإجراء اللي اتعمل / الرد على ولي الأمر", "Action taken / reply to parent")} className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs bg-white text-slate-800" />
        <p className="text-[11px] font-bold text-slate-500">{tr("هل ولي الأمر راضٍ عن النتيجة؟", "Is the parent satisfied with the outcome?")}</p>
        <div className="flex gap-1.5 justify-end">
          <Chip label={tr("غير محدد", "Unknown")} active={satisfied === null || satisfied === undefined} onClick={() => setSatisfied(null)} color="#64748b" />
          <Chip label={tr("غير راضٍ", "Not satisfied")} active={satisfied === false} onClick={() => setSatisfied(false)} color="#dc2626" />
          <Chip label={tr("راضٍ", "Satisfied")} active={satisfied === true} onClick={() => setSatisfied(true)} color="#059669" />
        </div>
        {status === "resolved" && c.status !== "resolved" && c.contact && <p className="text-[10.5px] text-teal-700">{tr("📧 هيتبعت إيميل لولي الأمر بإن الموضوع اتحل.", "📧 The parent will be emailed that this is resolved.")}</p>}
        <button onClick={save} disabled={saving} className="w-full bg-teal-600 text-white font-bold py-2.5 rounded-xl text-xs disabled:opacity-60">{saving ? tr("جارِ الحفظ...", "Saving...") : tr("حفظ", "Save")}</button>
      </div>
    </div>
  );
}

// ---------------- Survey results ----------------
function periodsOf(surveys) {
  return [...new Set([quarterOf(), ...surveys.map((s) => s.period)])].sort().reverse();
}

function SurveyTab({ tr, lang, data, approved, regById }) {
  const periods = periodsOf(data.surveys);
  const [period, setPeriod] = useState(periods[0]);
  const st = surveyStats({ surveys: data.surveys, period, eligible: approved.length });
  const prev = surveyStats({ surveys: data.surveys, period: prevQuarter(period), eligible: approved.length });
  const answeredIds = new Set(data.surveys.filter((s) => s.period === period).map((s) => s.registration_id));
  const notYet = approved.filter((r) => !answeredIds.has(r.id));
  const q = (id) => { const x = surveyQuestionById[id]; return x ? tr(x.ar, x.en) : id; };
  const who = (r) => (r.anonymous ? tr("ولي أمر (مجهول)", "Parent (anonymous)") : `${tr("ولي أمر", "Parent of")} ${first(regById[r.registration_id]?.form_data?.name)}`);
  const delta = st.satisfaction !== null && prev.satisfaction !== null ? st.satisfaction - prev.satisfaction : null;

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 justify-end flex-wrap">{periods.map((p) => <Chip key={p} label={quarterLabel(p, lang)} active={p === period} onClick={() => setPeriod(p)} />)}</div>
      <div className="grid grid-cols-3 gap-2">
        {[
          [tr("نسبة الرد", "Response"), st.responseRate === null ? "—" : `${st.responseRate}%`, `${st.n}/${st.eligible}`],
          [tr("الرضا", "Satisfaction"), st.satisfaction === null ? "—" : `${st.satisfaction}%`, delta === null ? "" : `${delta >= 0 ? "▲ +" : "▼ "}${delta}`],
          ["NPS", st.nps === null ? "—" : st.nps, ""],
        ].map(([k, v, s]) => (
          <div key={k} className="bg-white rounded-2xl p-2.5 border border-slate-100 text-center"><p className="text-lg font-extrabold text-teal-700">{v}</p><p className="text-[10.5px] font-bold text-slate-500">{k}</p><p className="text-[10px] text-slate-400">{s}</p></div>
        ))}
      </div>
      {st.n === 0 ? (
        <p className="text-xs text-slate-500 bg-white rounded-2xl p-4 border border-slate-100 text-center">{tr("لا توجد ردود لهذه الفترة بعد.", "No responses for this period yet.")}</p>
      ) : (
        <>
          <div className="bg-white rounded-2xl p-3 border border-slate-100 space-y-2">
            <p className="text-xs font-bold text-slate-700">{tr("الرضا حسب المحور (% راضٍ)", "Satisfaction by area (% satisfied)")}</p>
            {SURVEY_SECTIONS.map((sec) => {
              const s = st.perSection.find((x) => x.id === sec.id);
              const v = s?.satisfied ?? 0;
              return (
                <div key={sec.id}>
                  <div className="flex justify-between text-[11px] mb-0.5"><span className="font-bold text-slate-700">{s?.satisfied === null ? "—" : `${v}%`}</span><span className="text-slate-600">{sec.icon} {tr(sec.ar, sec.en)}</span></div>
                  <div dir="ltr" className="h-2.5 bg-slate-200 rounded-full overflow-hidden"><div style={{ width: `${v}%`, background: v >= TARGETS.satisfaction ? "#10b981" : v >= 70 ? "#f59e0b" : "#ef4444" }} className="h-full" /></div>
                </div>
              );
            })}
          </div>
          <div className="bg-white rounded-2xl p-3 border border-slate-100">
            <p className="text-xs font-bold text-slate-700 mb-1">{tr("البنود من الأضعف للأقوى", "Items, weakest first")}</p>
            {[...st.perQ].filter((x) => x.n > 0).sort((a, b) => a.satisfied - b.satisfied).map((x) => (
              <p key={x.id} className="text-[11px] text-slate-600 border-t border-slate-50 py-1 flex justify-between gap-2"><b style={{ color: x.satisfied >= TARGETS.satisfaction ? "#059669" : "#d97706" }}>{x.satisfied}%</b><span>{q(x.id)}</span></p>
            ))}
          </div>
          {[[tr("💛 ما يعجب الأهل", "💛 What parents like"), st.positive, "positive"], [tr("🛠 اقتراحات التحسين", "🛠 Suggestions to improve"), st.improve, "improve"]].map(([title, rows, key]) => (
            <div key={key} className="bg-white rounded-2xl p-3 border border-slate-100">
              <p className="text-xs font-bold text-slate-700 mb-1">{title}</p>
              {rows.length === 0 && <p className="text-[11px] text-slate-400">—</p>}
              {rows.map((r, i) => (<p key={i} className="text-[11px] text-slate-600 border-t border-slate-50 py-1">“{r[key]}” <span className="text-slate-400">— {who(r)}</span></p>))}
            </div>
          ))}
        </>
      )}
      {notYet.length > 0 && st.n > 0 && (
        <div className="bg-white rounded-2xl p-3 border border-slate-100">
          <p className="text-xs font-bold text-slate-700 mb-1">{tr(`⏳ لسه ما ردّوش (${notYet.length})`, `⏳ Not responded yet (${notYet.length})`)}</p>
          <p className="text-[11px] text-slate-500 leading-relaxed">{notYet.map((r) => r.form_data?.name).join(tr("، ", ", "))}</p>
        </div>
      )}
    </div>
  );
}

// ---------------- Monthly report ----------------
function ReportTab({ tr, lang, token, data, evals, regs, approved, regById, branchLabel, onChanged, showToast }) {
  const [month, setMonth] = useState(nowMonth());
  const savedNote = data.notes.find((n) => n.month === month)?.you_said_we_did || "";
  const [note, setNote] = useState(savedNote);
  const [busy, setBusy] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  useEffect(() => { setNote(data.notes.find((n) => n.month === month)?.you_said_we_did || ""); }, [month, data.notes]);

  const period = quarterOfMonth(month);
  const survey = surveyStats({ surveys: data.surveys, period, eligible: approved.length });
  const prevSurvey = surveyStats({ surveys: data.surveys, period: prevQuarter(period), eligible: approved.length });
  const cs = caseStats({ cases: data.cases, month });
  const comms = commsStats({ regs, evals, month });

  const saveNote = async () => {
    setSavingNote(true);
    const { data: d, error } = await supabase.functions.invoke("branch-admin", { body: { action: "save_note", token, month, you_said_we_did: note } });
    setSavingNote(false);
    if (error || d?.error) { showToast(tr("حصل خطأ في الحفظ", "Could not save")); return; }
    showToast(tr("تم حفظ الملاحظة ✓", "Note saved ✓"));
    onChanged();
  };

  const go = async (L) => {
    setBusy(L);
    try {
      const blob = await generatePartnershipPdfBlob({
        lang: L, branchLabel: branchLabel[L],
        data: { month, period, survey, prevSurvey, cases: cs, comms, note, firstNameOf: (id) => first(regById[id]?.form_data?.name) },
      });
      downloadBlob(blob, `Parent-Partnership-${month}-${L === "en" ? "EN" : "AR"}.pdf`);
    } catch (_e) { showToast(tr("حصل خطأ في عمل الملف", "Could not create the PDF")); }
    setBusy("");
  };

  const kp = (k, v, ok) => (
    <div key={k} className="bg-white rounded-2xl p-2.5 border border-slate-100 text-center"><p className="text-lg font-extrabold" style={{ color: ok === null ? "#64748b" : ok ? "#059669" : "#d97706" }}>{v}</p><p className="text-[10.5px] font-bold text-slate-500">{k}</p></div>
  );
  const ok = (v, t) => (v === null || v === undefined ? null : v >= t);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-800" />
        <p className="text-[11px] text-slate-500">{tr("الاستبيان المستخدم:", "Survey used:")} {quarterLabel(period, lang)}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {kp(tr("نسبة الرد", "Response"), survey.responseRate === null ? "—" : `${survey.responseRate}%`, ok(survey.responseRate, TARGETS.response))}
        {kp(tr("الرضا", "Satisfaction"), survey.satisfaction === null ? "—" : `${survey.satisfaction}%`, ok(survey.satisfaction, TARGETS.satisfaction))}
        {kp("NPS", survey.nps === null ? "—" : survey.nps, ok(survey.nps, TARGETS.nps))}
        {kp(tr("تقارير النمو المُرسلة", "Reports sent"), comms.sentRate === null ? "—" : `${comms.sentRate}%`, ok(comms.sentRate, TARGETS.reportsSent))}
        {kp(tr("ملاحظات الشهر", "Feedback"), cs.total, null)}
        {kp(tr("رد خلال 24س", "Replied ≤24h"), cs.ackRate === null ? "—" : `${cs.ackRate}%`, ok(cs.ackRate, TARGETS.resolveRate))}
        {kp(tr("حل خلال 5 أيام", "Resolved ≤5d"), cs.resolveRate === null ? "—" : `${cs.resolveRate}%`, ok(cs.resolveRate, TARGETS.resolveRate))}
        {kp(tr("متوسط أيام الحل", "Avg days"), cs.avgResolveDays === null ? "—" : cs.avgResolveDays.toFixed(1), cs.avgResolveDays === null ? null : cs.avgResolveDays <= TARGETS.resolveDays)}
        {kp(tr("متأخرة الآن", "Overdue now"), cs.overdue, cs.overdue === 0)}
      </div>
      <div className="bg-white rounded-2xl p-3 border border-slate-100 space-y-2">
        <p className="text-xs font-bold text-slate-700">{tr("💬 قلتم... وفعلنا", "💬 You said... we did")}</p>
        <p className="text-[10.5px] text-slate-400">{tr("اكتبي الإجراءات اللي اتعملت بناءً على آراء وشكاوى الأهل. بتظهر في التقرير.", "Describe the actions taken in response to parents' feedback. Appears in the report.")}</p>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs bg-white text-slate-800" />
        <button onClick={saveNote} disabled={savingNote} className="w-full bg-white border border-teal-300 text-teal-700 font-bold py-2 rounded-xl text-xs disabled:opacity-60">{savingNote ? tr("جارِ الحفظ...", "Saving...") : tr("حفظ الملاحظة", "Save note")}</button>
      </div>
      <div className="bg-white rounded-2xl p-3 border border-slate-100 space-y-2">
        <p className="text-xs font-bold text-slate-700">{tr("ملف للطباعة (PDF)", "Printable file (PDF)")}</p>
        <div className="flex gap-2">
          {["ar", "en"].map((L) => (
            <button key={L} type="button" disabled={!!busy} onClick={() => go(L)} className="flex-1 bg-teal-600 text-white font-bold py-2 rounded-xl text-[11px] disabled:opacity-60">
              {busy === L ? tr("جارِ التجهيز...", "Preparing...") : `📄 ${tr("تقرير شراكة الأهل", "Partnership report")} — ${L === "ar" ? tr("عربي", "Arabic") : "English"}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
