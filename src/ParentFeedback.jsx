// Parent side of the partnership features: quarterly survey + complaints/suggestions.
import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { SURVEY_SECTIONS, SURVEY_QUESTIONS, RATING_FACES, CASE_KINDS, CASE_CATEGORIES, kindOf, categoryOf, statusOf } from "./feedbackBank";
import { quarterOf, quarterLabel } from "./partnership";

async function call(body) {
  const { data, error } = await supabase.functions.invoke("parent-feedback", { body });
  if (error || data?.error) return { error: data?.error || error?.message || "error" };
  return { data };
}

export function useFeedbackStatus() {
  const [st, setSt] = useState(null);
  const reload = () => call({ action: "status" }).then(({ data }) => setSt(data || { cases: [], survey_done: true }));
  useEffect(() => { reload(); }, []);
  return [st, reload];
}

// Small reminder card on the home screen while this quarter's survey is still open.
export function SurveyBanner({ tr, lang, onOpen }) {
  const [st] = useFeedbackStatus();
  if (!st || st.survey_done) return null;
  return (
    <button type="button" onClick={onOpen} className="mx-4 mt-3 bg-gradient-to-l from-sky-500 to-cyan-400 text-white rounded-2xl px-4 py-3 text-right shadow-md">
      <p className="text-sm font-extrabold">{tr("💬 رأيك يهمنا — استبيان الأهل", "💬 Your opinion matters — parent survey")}</p>
      <p className="text-[11px] opacity-90">{tr(`${quarterLabel(st.period, "ar")} · 5 دقايق بس`, `${quarterLabel(st.period, "en")} · only 5 minutes`)}</p>
    </button>
  );
}

// ---------------- Survey ----------------
export function SurveyScreen({ tr, lang, showToast, onDone }) {
  const [st, reload] = useFeedbackStatus();
  const [answers, setAnswers] = useState({});
  const [nps, setNps] = useState(null);
  const [positive, setPositive] = useState("");
  const [improve, setImprove] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  if (!st) return <p className="text-xs text-slate-400 text-center py-8">{tr("جارِ التحميل...", "Loading...")}</p>;
  if (st.survey_done || done) {
    return (
      <div className="px-4 py-8 text-center space-y-2">
        <p className="text-4xl">💛</p>
        <p className="text-sm font-extrabold text-slate-800">{tr("شكراً لمشاركتك!", "Thank you for taking part!")}</p>
        <p className="text-xs text-slate-500 leading-relaxed">{tr("رأيك بيساعدنا نحسّن الحضانة. هنعمل الاستبيان ده كل 3 شهور.", "Your feedback helps us improve. We run this survey every 3 months.")}</p>
      </div>
    );
  }

  const total = SURVEY_QUESTIONS.length;
  const count = Object.keys(answers).length;
  const canSend = count >= Math.ceil(total * 0.6);

  const submit = async () => {
    setSending(true);
    const { error } = await call({ action: "submit_survey", answers, nps, positive, improve, anonymous, lang });
    setSending(false);
    if (error) { showToast(tr("حصل خطأ، جرّبي تاني", "Something went wrong, please try again")); return; }
    setDone(true);
    reload();
    onDone?.();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3 text-right">
          <p className="text-sm font-extrabold text-sky-800">{tr("استبيان الأهل", "Parent survey")} — {quarterLabel(st.period, lang)}</p>
          <p className="text-[11px] text-slate-600 leading-relaxed mt-1">{tr("حوالي 5 دقايق. اختاري الوجه اللي يعبّر عن رأيك. إجاباتك بتوصل لإدارة الفرع بس.", "About 5 minutes. Tap the face that matches your opinion. Your answers go to branch management only.")}</p>
        </div>

        {SURVEY_SECTIONS.map((sec) => (
          <div key={sec.id} className="bg-white rounded-2xl border border-slate-100 p-3 space-y-3">
            <p className="text-xs font-extrabold text-slate-700 text-right">{sec.icon} {tr(sec.ar, sec.en)}</p>
            {sec.q.map(([id, ar, en]) => {
              const v = answers[id];
              return (
                <div key={id} className="border-t border-slate-50 pt-2">
                  <p className="text-xs text-slate-700 text-right leading-relaxed mb-1.5">{tr(ar, en)}</p>
                  <div dir="ltr" className="flex justify-between gap-1">
                    {RATING_FACES.map((f) => (
                      <button key={f.v} type="button" onClick={() => setAnswers((a) => ({ ...a, [id]: f.v }))}
                        className="flex-1 rounded-xl py-1.5 text-xl border-2 transition"
                        style={{ borderColor: v === f.v ? f.color : "#e2e8f0", background: v === f.v ? `${f.color}22` : "#fff", opacity: v && v !== f.v ? 0.45 : 1 }}>
                        {f.e}
                      </button>
                    ))}
                  </div>
                  {v && <p className="text-[10px] font-bold mt-1 text-center" style={{ color: RATING_FACES[v - 1].color }}>{tr(RATING_FACES[v - 1].ar, RATING_FACES[v - 1].en)}</p>}
                </div>
              );
            })}
          </div>
        ))}

        <div className="bg-white rounded-2xl border border-slate-100 p-3 space-y-2">
          <p className="text-xs font-bold text-slate-700 text-right">{tr("من 0 إلى 10، ما احتمال أن تنصحي صديقة بحضانتنا؟", "From 0 to 10, how likely are you to recommend us to a friend?")}</p>
          <div dir="ltr" className="flex gap-0.5">
            {Array.from({ length: 11 }, (_, i) => (
              <button key={i} type="button" onClick={() => setNps(i)}
                className={`flex-1 py-2 rounded-lg text-[11px] font-bold border ${nps === i ? "bg-sky-500 text-white border-sky-500" : "bg-white text-slate-500 border-slate-200"}`}>{i}</button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-3 space-y-2">
          <textarea value={positive} onChange={(e) => setPositive(e.target.value)} rows={2} placeholder={tr("إيه أكتر حاجة عاجباكِ عندنا؟ (اختياري)", "What do we do best? (optional)")} className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs bg-white text-slate-800" />
          <textarea value={improve} onChange={(e) => setImprove(e.target.value)} rows={2} placeholder={tr("إيه اللي نقدر نحسّنه؟ (اختياري)", "What could we improve? (optional)")} className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs bg-white text-slate-800" />
          <label className="flex items-center gap-2 text-[11px] text-slate-600 justify-end">
            {tr("ما تظهريش اسمي مع ردّي", "Don't show my name with my answers")}
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          </label>
          <p className="text-[10px] text-slate-400 text-right">{tr("لو سبتيه فاضي، إدارة الفرع تقدر تتواصل معاكِ بخصوص ملاحظاتك.", "If left unticked, branch management may contact you about your comments.")}</p>
        </div>
      </div>

      <div className="px-4 py-3 bg-white border-t border-slate-100">
        <button type="button" onClick={submit} disabled={!canSend || sending} className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50">
          {sending ? tr("جارِ الإرسال...", "Sending...") : tr(`إرسال (${count}/${total})`, `Submit (${count}/${total})`)}
        </button>
        {!canSend && <p className="text-[10px] text-slate-400 text-center mt-1">{tr("جاوبي على 60% من الأسئلة على الأقل.", "Please answer at least 60% of the questions.")}</p>}
      </div>
    </div>
  );
}

// ---------------- Complaints / feedback ----------------
export function FeedbackScreen({ tr, lang, showToast }) {
  const [st, reload] = useFeedbackStatus();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("complaint");
  const [category, setCategory] = useState("care");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const submit = async () => {
    if (!subject.trim() || !description.trim()) { showToast(tr("اكتبي العنوان والتفاصيل", "Please add a title and details")); return; }
    setSending(true);
    const { data, error } = await call({ action: "submit_case", kind, category, subject, description, lang });
    setSending(false);
    if (error) { showToast(tr("حصل خطأ، جرّبي تاني", "Something went wrong, please try again")); return; }
    showToast(tr(`تم الإرسال ✓ الرقم المرجعي ${data.ref}`, `Sent ✓ Reference ${data.ref}`));
    setSubject(""); setDescription(""); setOpen(false);
    reload();
  };

  const cases = st?.cases || [];
  return (
    <div className="px-4 py-4 space-y-3 overflow-y-auto h-full pb-4">
      <button onClick={() => setOpen(true)} className="w-full bg-rose-500 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-1">
        <Plus className="w-4 h-4" /> {tr("شكوى / اقتراح / شكر", "Complaint / suggestion / compliment")}
      </button>
      <p className="text-[11px] text-slate-500 text-center">{tr("هنرد خلال 24 ساعة ونحاول نحل الموضوع خلال 5 أيام عمل.", "We reply within 24 hours and aim to resolve within 5 working days.")}</p>

      {!st && <p className="text-xs text-slate-400 text-center">{tr("جارِ التحميل...", "Loading...")}</p>}
      {st && cases.length === 0 && <p className="text-xs text-slate-400 text-center py-4">{tr("ما فيش ملاحظات لسه.", "No feedback yet.")}</p>}

      <div className="space-y-2">
        {cases.map((c) => {
          const s = statusOf(c.status);
          const k = kindOf(c.kind);
          return (
            <button key={c.id} type="button" onClick={() => setExpanded(expanded === c.id ? null : c.id)} className="w-full bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 text-right">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: s.color }}>{tr(s.ar, s.en)}</span>
                <p className="text-sm font-bold text-slate-800">{k.icon} {c.subject}</p>
              </div>
              <p className="text-[10px] text-slate-400">{c.ref} · {tr(categoryOf(c.category).ar, categoryOf(c.category).en)} · {new Date(c.received_at).toLocaleDateString(lang === "ar" ? "ar-AE" : "en-GB")}</p>
              {expanded === c.id && (
                <div className="mt-2 space-y-1.5">
                  <p className="text-xs text-slate-600 whitespace-pre-wrap bg-slate-50 rounded-lg p-2">{c.description}</p>
                  {c.action_taken && !c.sensitive && <p className="text-xs text-emerald-800 whitespace-pre-wrap bg-emerald-50 rounded-lg p-2"><b>{tr("رد الإدارة: ", "Management reply: ")}</b>{c.action_taken}</p>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-end z-50">
          <div className="bg-white w-full rounded-t-3xl p-5 space-y-3 max-w-sm mx-auto max-h-[90%] overflow-y-auto">
            <div className="flex items-center justify-between">
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
              <p className="font-bold text-slate-800 text-sm">{tr("ملاحظة جديدة", "New feedback")}</p>
            </div>
            <div className="flex gap-1.5 justify-end">
              {CASE_KINDS.map((k) => (
                <button key={k.id} type="button" onClick={() => setKind(k.id)} className={`text-xs font-bold px-3 py-1.5 rounded-full border ${kind === k.id ? "bg-rose-500 text-white border-rose-500" : "bg-white text-slate-600 border-slate-200"}`}>{k.icon} {tr(k.ar, k.en)}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 justify-end">
              {CASE_CATEGORIES.map((c) => (
                <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${category === c.id ? "bg-sky-500 text-white border-sky-500" : "bg-white text-slate-600 border-slate-200"}`}>{tr(c.ar, c.en)}</button>
              ))}
            </div>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={tr("العنوان", "Title")} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white text-slate-800" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder={tr("اكتبي التفاصيل...", "Write the details...")} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white text-slate-800" />
            <button onClick={submit} disabled={sending} className="w-full bg-rose-500 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-60">{sending ? tr("جارِ الإرسال...", "Sending...") : tr("إرسال", "Send")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export { quarterOf };
