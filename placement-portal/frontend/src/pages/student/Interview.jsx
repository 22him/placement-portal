import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api, { errMsg } from '../../api';
import { useApp } from '../../AppContext';
import { useLoad, PageLoader, ErrorBox, PageHeader, Field, Spinner, Badge, Empty, Progress, fmtDate } from '../../components/ui';

export default function Interview() {
  const { toast } = useApp();
  const list = useLoad(async () => (await api.get('/student/interview')).data);
  const [setup, setSetup] = useState({ type: 'technical', role: '', company: '', count: 5 });
  const [session, setSession] = useState(null);
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState('');

  if (list.loading) return <PageLoader />;
  if (list.error) return <ErrorBox message={list.error} onRetry={list.reload} />;

  const start = async (e) => {
    e.preventDefault();
    if (!setup.role.trim()) return toast('Enter the role you are preparing for', 'error');
    if (setup.type === 'company' && !setup.company.trim()) return toast('Enter a company name', 'error');
    setBusy('gen');
    try {
      const { data } = await api.post('/student/interview/generate', setup);
      setSession(data.session); setIdx(0); setText('');
    } catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(''); }
  };

  const openSession = async (id) => {
    try {
      const { data } = await api.get(`/student/interview/${id}`);
      setSession(data.session); setIdx(0); setText('');
    } catch (err) { toast(errMsg(err), 'error'); }
  };

  const submit = async () => {
    if (text.trim().length < 10) return toast('Write a fuller answer (at least 10 characters)', 'error');
    setBusy('eval');
    try {
      const { data } = await api.post(`/student/interview/${session._id}/answer`, { index: idx, answer: text });
      setSession(data.session); setText('');
    } catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(''); }
  };

  const finish = async () => {
    setBusy('fin');
    try {
      const { data } = await api.post(`/student/interview/${session._id}/finish`);
      setSession(data.session); list.reload(); toast('Interview completed');
    } catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(''); }
  };

  const del = async (id) => {
    if (!confirm('Delete this session?')) return;
    try { await api.delete(`/student/interview/${id}`); if (session?._id === id) setSession(null); list.reload(); } catch (err) { toast(errMsg(err), 'error'); }
  };

  if (session) {
    const done = session.status === 'completed';
    const q = session.questions[idx];
    const answered = session.questions.filter((x) => x.evaluated).length;
    return (
      <>
        <PageHeader title="Mock interview" subtitle={`${session.type.toUpperCase()} · ${session.role}${session.company ? ` · ${session.company}` : ''}`}
          actions={<><button className="btn-ghost" onClick={() => { setSession(null); list.reload(); }}>Back</button>{!done && <button className="btn-primary" onClick={finish} disabled={busy === 'fin' || !answered}>{busy === 'fin' && <Spinner />} Finish & score</button>}</>} />
        {done && (
          <div className="card mb-5 flex items-center gap-4"><p className="text-4xl font-bold">{session.overallScore}%</p><div className="flex-1"><p className="text-sm text-slate-500">Overall interview score</p><Progress value={session.overallScore} className="mt-2" /></div></div>
        )}
        <div className="grid gap-5 lg:grid-cols-[16rem_1fr]">
          <div className="card h-fit">
            <p className="mb-2 text-sm font-semibold">Questions ({answered}/{session.questions.length} answered)</p>
            <div className="flex flex-wrap gap-2 lg:flex-col">
              {session.questions.map((x, i) => (
                <button key={i} onClick={() => { setIdx(i); setText(''); }} className={`rounded-lg border px-3 py-2 text-left text-sm transition ${i === idx ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 dark:border-slate-700'}`}>
                  Q{i + 1} {x.evaluated && <Badge color={x.score >= 7 ? 'green' : x.score >= 4 ? 'amber' : 'red'}>{x.score}/10</Badge>}
                </button>
              ))}
            </div>
          </div>
          <div className="card space-y-4">
            <p className="text-lg font-medium">Q{idx + 1}. {q.question}</p>
            {q.evaluated ? (
              <div className="space-y-3 text-sm">
                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800"><p className="label">Your answer</p>{q.answer}</div>
                <p><Badge color={q.score >= 7 ? 'green' : q.score >= 4 ? 'amber' : 'red'}>Score {q.score}/10</Badge></p>
                <div><p className="label">Feedback</p>{q.feedback}</div>
                {q.improvements?.length > 0 && <div><p className="label">How to improve</p><ul className="list-disc space-y-1 pl-5">{q.improvements.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
                {q.idealPoints?.length > 0 && <div><p className="label">Points a strong answer covers</p><ul className="list-disc space-y-1 pl-5">{q.idealPoints.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
              </div>
            ) : done ? <p className="text-sm text-slate-500">This question was skipped.</p> : (
              <>
                <textarea className="input min-h-40" placeholder="Type your answer as you would say it in the interview…" value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} />
                <div className="flex items-center justify-between"><span className="text-xs text-slate-400">{text.length}/4000</span>
                  <button className="btn-primary" onClick={submit} disabled={busy === 'eval'}>{busy === 'eval' && <Spinner />} Submit for AI evaluation</button></div>
              </>
            )}
            <div className="flex justify-between pt-2">
              <button className="btn-ghost" disabled={idx === 0} onClick={() => { setIdx(idx - 1); setText(''); }}>Previous</button>
              <button className="btn-ghost" disabled={idx === session.questions.length - 1} onClick={() => { setIdx(idx + 1); setText(''); }}>Next</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const completed = list.data.items.filter((i) => i.status === 'completed').map((i) => ({ date: fmtDate(i.createdAt), score: i.overallScore }));
  return (
    <>
      <PageHeader title="AI mock interview" subtitle="Questions are generated by AI and each answer is evaluated and scored." />
      <form onSubmit={start} className="card mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <Field label="Interview type">
          <select className="input" value={setup.type} onChange={(e) => setSetup({ ...setup, type: e.target.value })}>
            <option value="technical">Technical</option><option value="hr">HR / Behavioural</option><option value="company">Company-specific</option>
          </select>
        </Field>
        <Field label="Target role"><input className="input" placeholder="e.g. Software Developer" value={setup.role} onChange={(e) => setSetup({ ...setup, role: e.target.value })} /></Field>
        <Field label="Company"><input className="input" disabled={setup.type !== 'company'} placeholder={setup.type === 'company' ? 'e.g. TechNova Solutions' : 'Only for company-specific'} value={setup.company} onChange={(e) => setSetup({ ...setup, company: e.target.value })} /></Field>
        <Field label="Questions"><input className="input" type="number" min="3" max="10" value={setup.count} onChange={(e) => setSetup({ ...setup, count: e.target.value })} /></Field>
        <button className="btn-primary" disabled={busy === 'gen'}>{busy === 'gen' && <Spinner />} Start interview</button>
      </form>

      {completed.length > 1 && (
        <div className="card mb-5"><h2 className="mb-3 font-semibold">Performance trend</h2>
          <div className="h-56"><ResponsiveContainer><LineChart data={completed}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="date" fontSize={12} /><YAxis domain={[0, 100]} fontSize={12} /><Tooltip /><Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={3} dot /></LineChart></ResponsiveContainer></div></div>
      )}

      <div className="card">
        <h2 className="mb-3 font-semibold">Your sessions</h2>
        {list.data.items.length === 0 ? <Empty text="No interviews yet. Start your first one above." /> : (
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr><th className="th">Type</th><th className="th">Role</th><th className="th">Company</th><th className="th">Status</th><th className="th">Score</th><th className="th">Date</th><th /></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.data.items.map((s) => (
                <tr key={s._id}>
                  <td className="td capitalize">{s.type}</td><td className="td">{s.role}</td><td className="td">{s.company || '—'}</td>
                  <td className="td"><Badge color={s.status === 'completed' ? 'green' : 'amber'}>{s.status.replace('_', ' ')}</Badge></td>
                  <td className="td font-semibold">{s.overallScore ?? '—'}</td><td className="td">{fmtDate(s.createdAt)}</td>
                  <td className="td text-right"><button className="btn-ghost !py-1" onClick={() => openSession(s._id)}>{s.status === 'completed' ? 'Review' : 'Continue'}</button> <button className="btn-ghost !py-1 text-red-600" onClick={() => del(s._id)} aria-label="Delete"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody></table></div>
        )}
      </div>
    </>
  );
}
