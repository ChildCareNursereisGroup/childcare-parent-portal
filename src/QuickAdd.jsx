// Quick add of existing children (from Excel / CSV) so parents can sign in by e-mail
// without filling the full registration form, plus the invitation e-mails.
import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "./lib/supabaseClient";

const HEAD_MAP = {
  name: ["child_name", "name", "kids name", "kid name", "child", "الاسم", "اسم الطفل"],
  gender: ["gender", "m/f", "sex", "النوع", "الجنس"],
  dob: ["date_of_birth", "dob", "date of birth", "birth", "تاريخ الميلاد"],
  class_name: ["class", "class name", "classname", "الفصل"],
  mother_phone: ["mother_phone", "mother", "m (mother)", "mother contact", "mom", "موبايل الأم"],
  father_phone: ["father_phone", "father", "f (father)", "father contact", "dad", "موبايل الأب"],
  email: ["email", "email id", "e-mail", "الإيميل", "البريد"],
  villa: ["villa", "الفيلا"],
  parent_name: ["parent_name", "parent", "اسم ولي الأمر"],
};

function parseTable(text) {
  const t = text.replace(/^﻿/, "").replace(/\r\n/g, "\n").trim();
  if (!t) return [];
  const delim = t.split("\n")[0].includes("\t") ? "\t" : ",";
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) {
      if (ch === '"' && t[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  row.push(cell); rows.push(row);
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const idx = {};
  for (const [key, names] of Object.entries(HEAD_MAP)) idx[key] = head.findIndex((h) => names.includes(h));
  if (idx.name < 0) return [];
  return rows.slice(1).filter((r) => r.some((c) => c.trim())).map((r) => {
    const g = (k) => (idx[k] >= 0 ? String(r[idx[k]] || "").trim() : "");
    const gl = g("gender").toLowerCase();
    return {
      name: g("name"),
      gender: ["girl", "female", "f", "أنثى", "بنت"].includes(gl) ? "girl" : ["boy", "male", "m", "ذكر", "ولد"].includes(gl) ? "boy" : "",
      dob: g("dob").slice(0, 10),
      class_name: g("class_name"),
      mother_phone: g("mother_phone"),
      father_phone: g("father_phone"),
      email: g("email").toLowerCase(),
      villa: g("villa"),
      parent_name: g("parent_name"),
    };
  });
}

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

export function QuickAddScreen({ tr, session, onClose, onChanged, showToast }) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState(null);
  const [invite, setInvite] = useState(null); // { pending, confirming, sending, sent, failed }

  const load = (t) => { setText(t); setRows(parseTable(t)); setSummary(null); };
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => load(String(rd.result || ""));
    rd.readAsText(f, "utf-8");
  };

  const withEmail = rows.filter((r) => emailOk(r.email)).length;
  const badEmail = rows.filter((r) => r.email && !emailOk(r.email)).length;

  const add = async () => {
    setBusy(true);
    const tally = { added: 0, added_no_email: 0, updated: 0, duplicate: 0, invalid: 0, notes: [] };
    for (let i = 0; i < rows.length; i += 30) {
      const { data, error } = await supabase.functions.invoke("branch-admin", { body: { action: "quick_add", token: session.token, children: rows.slice(i, i + 30) } });
      if (error || data?.error) { showToast(tr("حصل خطأ، اللي اتضاف اتحفظ — جرّبي تاني", "Error — what was added is saved, try again")); break; }
      for (const r of data.results) { tally[r.status] = (tally[r.status] || 0) + 1; if (r.status === "invalid") tally.notes.push(`${r.name}: ${r.note}`); }
    }
    setBusy(false);
    setSummary(tally);
    onChanged();
    refreshPending();
  };

  const refreshPending = async () => {
    const { data } = await supabase.functions.invoke("branch-admin", { body: { action: "send_invites", token: session.token, dry_run: true } });
    setInvite((v) => ({ ...(v || {}), pending: data?.pending_emails ?? 0 }));
  };

  const sendInvites = async () => {
    setInvite((v) => ({ ...v, confirming: false, sending: true, sent: 0, failed: [] }));
    let sent = 0, failed = [];
    for (let guard = 0; guard < 20; guard++) {
      const { data, error } = await supabase.functions.invoke("branch-admin", { body: { action: "send_invites", token: session.token, limit: 25 } });
      if (error || data?.error) { failed.push(data?.error || error.message); break; }
      sent += data.sent; failed = failed.concat(data.failed || []);
      setInvite((v) => ({ ...v, sent, pending: data.remaining }));
      if (data.sent === 0 || data.remaining <= 0) break;
    }
    setInvite((v) => ({ ...v, sending: false, sent, failed }));
    showToast(tr(`تم إرسال ${sent} دعوة ✓`, `${sent} invitations sent ✓`));
    refreshPending();
  };

  return (
    <div className="absolute inset-0 z-20 bg-slate-50 flex flex-col">
      <div className="flex items-center justify-between px-4 pt-5 pb-3 bg-white border-b border-slate-100">
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100"><X className="w-4 h-4 text-slate-400" /></button>
        <p className="font-extrabold text-slate-800 text-sm">{tr("➕ إضافة سريعة للأطفال الحاليين", "➕ Quick add existing children")}</p>
        <span className="w-8" />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-right">
        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3 text-[11px] text-slate-600 leading-relaxed">
          {tr("اختاري ملف Excel/CSV أو الصقي الجدول. الأعمدة: الاسم، النوع (boy/girl)، تاريخ الميلاد (2023-05-20)، الفصل، موبايل الأم، موبايل الأب، الإيميل. الأطفال بيتفعّلوا فوراً، والأهل بيدخلوا بإيميلهم بكود على الإيميل من غير استمارة.",
            "Choose an Excel/CSV file or paste the table. Columns: name, gender (boy/girl), date of birth (2023-05-20), class, mother phone, father phone, email. Children are activated immediately; parents sign in with an e-mail code, no form.")}
        </div>
        <input type="file" accept=".csv,.txt,.tsv" onChange={onFile} className="block w-full text-xs text-slate-600" />
        <textarea value={text} onChange={(e) => load(e.target.value)} rows={4} placeholder={tr("أو الصقي الجدول هنا (من Excel)...", "Or paste the table here (from Excel)...")} className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-xs bg-white text-slate-800" dir="ltr" />

        {rows.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-3 space-y-2">
            <p className="text-xs font-bold text-slate-700">{tr(`${rows.length} طفل جاهز للإضافة`, `${rows.length} children ready`)}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-50 rounded-xl py-2"><p className="text-lg font-extrabold text-emerald-600">{withEmail}</p><p className="text-[10px] font-bold text-slate-500">{tr("بإيميل صحيح", "valid e-mail")}</p></div>
              <div className="bg-amber-50 rounded-xl py-2"><p className="text-lg font-extrabold text-amber-600">{rows.length - withEmail - badEmail}</p><p className="text-[10px] font-bold text-slate-500">{tr("بدون إيميل", "no e-mail")}</p></div>
              <div className="bg-rose-50 rounded-xl py-2"><p className="text-lg font-extrabold text-rose-600">{badEmail}</p><p className="text-[10px] font-bold text-slate-500">{tr("إيميل غلط", "bad e-mail")}</p></div>
            </div>
            <p className="text-[10.5px] text-slate-400">{tr("اللي بدون إيميل بيتضاف برضه (المعلمة تقدر تقيّمه)، بس ولي الأمر مش هيقدر يدخل لحد ما نضيف إيميله.", "Children without an e-mail are still added (staff can evaluate them) but the parent can't sign in until an e-mail is added.")}</p>
            <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-lg">
              {rows.slice(0, 12).map((r, i) => (
                <p key={i} className="text-[10.5px] px-2 py-1 border-b border-slate-50 flex justify-between gap-2"><span dir="ltr" className={emailOk(r.email) ? "text-emerald-600" : "text-rose-500"}>{r.email || "—"}</span><span className="text-slate-700 font-bold">{r.name}</span></p>
              ))}
              {rows.length > 12 && <p className="text-[10px] text-slate-400 text-center py-1">+{rows.length - 12}</p>}
            </div>
            <button onClick={add} disabled={busy} className="w-full bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs disabled:opacity-60">
              {busy ? tr("جارِ الإضافة...", "Adding...") : tr(`✅ إضافة ${rows.length} طفل`, `✅ Add ${rows.length} children`)}
            </button>
          </div>
        )}

        {summary && (
          <div className="bg-white rounded-2xl border border-emerald-200 p-3 text-xs space-y-1">
            <p className="font-bold text-emerald-700">{tr("تمت الإضافة ✓", "Done ✓")}</p>
            <p>{tr(`اتضاف: ${summary.added + summary.added_no_email} (منهم ${summary.added_no_email} بدون إيميل)`, `Added: ${summary.added + summary.added_no_email} (${summary.added_no_email} without e-mail)`)}</p>
            {summary.updated > 0 && <p>{tr(`اتحدّث إيميل: ${summary.updated}`, `E-mail added to existing: ${summary.updated}`)}</p>}
            {summary.duplicate > 0 && <p className="text-slate-500">{tr(`موجود قبل كده (اتخطّى): ${summary.duplicate}`, `Already existed (skipped): ${summary.duplicate}`)}</p>}
            {summary.invalid > 0 && <p className="text-rose-600">{tr(`فيه مشكلة: ${summary.invalid}`, `Problems: ${summary.invalid}`)} {summary.notes.slice(0, 5).join(" | ")}</p>}
          </div>
        )}

        {invite && invite.pending !== undefined && (
          <div className="bg-white rounded-2xl border border-slate-100 p-3 space-y-2">
            <p className="text-xs font-bold text-slate-700">{tr("📧 دعوات الدخول للأهل", "📧 Sign-in invitations")}</p>
            <p className="text-[11px] text-slate-500">{tr(`لسه ما اتبعتلهمش دعوة: ${invite.pending} ولي أمر. الإيميل عام (من غير بيانات الطفل) وفيه رابط البوابة وطريقة الدخول بالكود.`, `Parents not yet invited: ${invite.pending}. The e-mail is generic (no child details) with the portal link and how to sign in with a code.`)}</p>
            {invite.confirming ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 space-y-2">
                <p className="text-[11px] font-bold text-amber-800">{tr(`هيتبعت ${invite.pending} إيميل لأولياء الأمور. متأكدة؟`, `${invite.pending} e-mails will be sent to parents. Sure?`)}</p>
                <div className="flex gap-2">
                  <button onClick={() => setInvite((v) => ({ ...v, confirming: false }))} className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-2 rounded-xl text-xs">{tr("إلغاء", "Cancel")}</button>
                  <button onClick={sendInvites} className="flex-1 bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs">{tr("أيوه، ابعتي", "Yes, send")}</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setInvite((v) => ({ ...v, confirming: true }))} disabled={invite.sending || invite.pending === 0} className="w-full bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs disabled:opacity-50">
                {invite.sending ? tr(`جارِ الإرسال... (${invite.sent || 0})`, `Sending... (${invite.sent || 0})`) : tr("إرسال الدعوات", "Send invitations")}
              </button>
            )}
            {invite.failed?.length > 0 && <p className="text-[10.5px] text-rose-600">{tr("فشل:", "Failed:")} {invite.failed.slice(0, 3).join(" | ")}</p>}
          </div>
        )}
        {!invite && (
          <button onClick={refreshPending} className="w-full text-[11px] text-sky-600 font-bold py-1">{tr("عرض دعوات الدخول المعلّقة", "Show pending invitations")}</button>
        )}
      </div>
    </div>
  );
}
