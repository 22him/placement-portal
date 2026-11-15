import { useState } from 'react';
import { ExternalLink, CheckCircle2, Circle } from 'lucide-react';
import api, { errMsg } from '../../api';
import { useApp } from '../../AppContext';
import { useLoad, PageLoader, ErrorBox, PageHeader, Badge, Empty, Progress, Stat, Modal, Field, Spinner, statusColor } from '../../components/ui';
import { Code2, Flame, Trophy } from 'lucide-react';

export default function Coding() {
  const { toast } = useApp();
  const [f, setF] = useState({ search: '', difficulty: '', topic: '', status: '' });
  const list = useLoad(async () => (await api.get('/student/coding', { params: f })).data, [f.search, f.difficulty, f.topic, f.status]);
  const prog = useLoad(async () => (await api.get('/student/coding/progress')).data);
  const recs = useLoad(async () => (await api.get('/student/coding/recommendations')).data);
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState({ language: '', code: '', notes: '' });
  const [busy, setBusy] = useState(false);

  const refresh = () => { list.reload(); prog.reload(); recs.reload(); };

  const save = async (status) => {
    setBusy(true);
    try {
      await api.post(`/student/coding/${sel._id}/submit`, { status, ...form });
      toast(status === 'solved' ? 'Marked as solved' : 'Saved as attempted');
      setSel(null); refresh();
    } catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(false); }
  };
  const clear = async () => {
    setBusy(true);
    try { await api.delete(`/student/coding/${sel._id}/submit`); setSel(null); refresh(); } catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(false); }
  };

  if (prog.loading) return <PageLoader />;
  if (prog.error) return <ErrorBox message={prog.error} onRetry={prog.reload} />;
  const c = prog.data.coding;

  return (
    <>
      <PageHeader title="Coding practice" subtitle="Solve problems on the linked platform, then record your progress and notes here." />
      <div className="mb-5 grid gap-5 sm:grid-cols-3">
        <Stat icon={Code2} label="Solved" value={`${c.solved}/${c.total}`} hint={`${c.percent}% complete`} />
        <Stat icon={Flame} accent="violet" label="Easy / Medium / Hard" value={`${c.byDifficulty.Easy} / ${c.byDifficulty.Medium} / ${c.byDifficulty.Hard}`} />
        <Stat icon={Trophy} label="Weak topics" value={prog.data.weakTopics.length} hint={prog.data.weakTopics.slice(0, 3).join(', ') || 'None yet'} />
      </div>

      {recs.data?.items?.length > 0 && (
        <div className="card mb-5">
          <h2 className="mb-3 font-semibold">Recommended next</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recs.data.items.map((q) => (
              <button key={q._id} onClick={() => { setSel(q); setForm({ language: '', code: '', notes: '' }); }} className="rounded-lg border border-slate-200 p-3 text-left transition hover:border-violet-400 dark:border-slate-700">
                <p className="text-sm font-medium">{q.title}</p>
                <div className="mt-1 flex items-center gap-2"><Badge color={statusColor(q.difficulty)}>{q.difficulty}</Badge><span className="text-xs text-slate-500">{q.reason}</span></div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input className="input" placeholder="Search questions" value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} />
          <select className="input" value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })}><option value="">All topics</option>{list.data?.topics.map((t) => <option key={t}>{t}</option>)}</select>
          <select className="input" value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })}><option value="">All difficulties</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
          <select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">All statuses</option><option value="todo">To do</option><option value="attempted">Attempted</option><option value="solved">Solved</option></select>
        </div>
        {list.loading && !list.data ? <PageLoader /> : list.error ? <ErrorBox message={list.error} onRetry={list.reload} /> : list.data.items.length === 0 ? <Empty text="No questions match your filters." /> : (
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr><th className="th w-8" /><th className="th">Title</th><th className="th">Topic</th><th className="th">Difficulty</th><th /></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.data.items.map((q) => (
                <tr key={q._id}>
                  <td className="td">{q.status === 'solved' ? <CheckCircle2 size={18} className="text-emerald-500" /> : q.status === 'attempted' ? <Circle size={18} className="text-amber-500" /> : <Circle size={18} className="text-slate-300" />}</td>
                  <td className="td font-medium">{q.title}</td><td className="td">{q.topic}</td>
                  <td className="td"><Badge color={statusColor(q.difficulty)}>{q.difficulty}</Badge></td>
                  <td className="td text-right"><button className="btn-ghost !py-1" onClick={() => { setSel(q); setForm({ language: '', code: '', notes: '' }); }}>Open</button></td>
                </tr>
              ))}
            </tbody></table></div>
        )}
      </div>

      {sel && (
        <Modal title={sel.title} onClose={() => setSel(null)} wide>
          <div className="space-y-3 text-sm">
            <div className="flex gap-2"><Badge color={statusColor(sel.difficulty)}>{sel.difficulty}</Badge><Badge color="blue">{sel.topic}</Badge></div>
            <p>{sel.description}</p>
            {sel.hints?.length > 0 && <p className="text-slate-500">Hint: {sel.hints[0]}</p>}
            {sel.link && <a className="inline-flex items-center gap-1 text-brand-600 underline" href={sel.link} target="_blank" rel="noreferrer">Solve on the practice platform <ExternalLink size={14} /></a>}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Language"><input className="input" placeholder="Python, Java…" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} /></Field>
              <Field label="Notes"><input className="input" placeholder="Approach, complexity…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
            </div>
            <Field label="Your solution (optional, saved for revision)"><textarea className="input min-h-32 font-mono text-xs" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
            <div className="flex flex-wrap justify-end gap-2">
              {sel.status && sel.status !== 'todo' && <button className="btn-ghost" disabled={busy} onClick={clear}>Reset progress</button>}
              <button className="btn-ghost" disabled={busy} onClick={() => save('attempted')}>Mark attempted</button>
              <button className="btn-primary" disabled={busy} onClick={() => save('solved')}>{busy && <Spinner />} Mark solved</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
