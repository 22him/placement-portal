import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import api, { errMsg } from '../../api';
import { useApp } from '../../AppContext';
import { useLoad, PageLoader, ErrorBox, PageHeader, Field, Spinner, Progress, Badge, Empty } from '../../components/ui';

export default function Roadmap() {
  const { toast } = useApp();
  const { data, loading, error, reload, setData } = useLoad(async () => (await api.get('/student/roadmap')).data);
  const [form, setForm] = useState({ targetRole: '', hoursPerWeek: 10, weeks: 4 });
  const [busy, setBusy] = useState(false);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const r = data.roadmap;

  const generate = async (e) => {
    e?.preventDefault();
    const body = r ? { targetRole: r.targetRole, hoursPerWeek: r.hoursPerWeek, weeks: r.weeks.length } : form;
    if (!body.targetRole) return toast('Select a target role', 'error');
    setBusy(true);
    try {
      const res = await api.post('/student/roadmap/generate', body);
      setData({ ...data, roadmap: res.data.roadmap });
      toast('Roadmap generated from your latest performance');
    } catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(false); }
  };

  const toggle = async (w, t, done) => {
    try {
      const res = await api.patch(`/student/roadmap/${r._id}/task`, { week: w, task: t, done });
      setData({ ...data, roadmap: res.data.roadmap });
    } catch (err) { toast(errMsg(err), 'error'); }
  };

  const del = async () => {
    if (!confirm('Delete this roadmap?')) return;
    try { await api.delete(`/student/roadmap/${r._id}`); reload(); } catch (err) { toast(errMsg(err), 'error'); }
  };

  const week = (n) => (r.weeks[n].tasks.filter((t) => t.done).length / (r.weeks[n].tasks.length || 1)) * 100;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader title="Personalised learning roadmap" subtitle="Built by AI from your coding, aptitude, interview and resume data."
        actions={r && <><button className="btn-primary" onClick={generate} disabled={busy}>{busy && <Spinner />} Refresh from latest performance</button><button className="btn-ghost text-red-600" onClick={del} aria-label="Delete roadmap"><Trash2 size={16} /></button></>} />
      {!r ? (
        <form onSubmit={generate} className="card grid gap-4 sm:grid-cols-4 sm:items-end">
          <Field label="Target role"><select className="input" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}><option value="">Select role</option>{data.roles.map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Hours per week"><input className="input" type="number" min="2" max="60" value={form.hoursPerWeek} onChange={(e) => setForm({ ...form, hoursPerWeek: e.target.value })} /></Field>
          <Field label="Weeks"><input className="input" type="number" min="1" max="12" value={form.weeks} onChange={(e) => setForm({ ...form, weeks: e.target.value })} /></Field>
          <button className="btn-primary" disabled={busy}>{busy && <Spinner />} Generate roadmap</button>
        </form>
      ) : (
        <>
          <div className="card mb-5 grid gap-4 md:grid-cols-3">
            <div><p className="text-sm text-slate-500">Target role</p><p className="text-lg font-semibold">{r.targetRole}</p><p className="text-xs text-slate-500">{r.hoursPerWeek} hrs/week · {r.weeks.length} weeks</p></div>
            <div><p className="text-sm text-slate-500">Overall progress ({r.progress.done}/{r.progress.total} tasks)</p><p className="text-2xl font-bold">{r.progress.percent}%</p><Progress value={r.progress.percent} className="mt-1" /></div>
            <div><p className="mb-1 text-sm text-slate-500">Weak areas identified</p><div className="flex flex-wrap gap-1">{r.weakAreas.length ? r.weakAreas.map((a) => <Badge key={a} color="red">{a}</Badge>) : <span className="text-xs text-slate-400">None</span>}</div>
              <p className="mt-2 text-xs text-slate-500">Done today: {r.progress.byDay[today] || 0} tasks</p></div>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {r.weeks.map((w, wi) => (
              <div key={wi} className="card">
                <div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">Week {w.week}: {w.focus}</h3><span className="text-xs text-slate-500">{Math.round(week(wi))}%</span></div>
                <Progress value={week(wi)} className="mb-3" />
                <ul className="space-y-2">
                  {w.tasks.map((t, ti) => (
                    <li key={ti} className="flex items-start gap-3 text-sm">
                      <input type="checkbox" className="mt-1 h-4 w-4 accent-violet-600" checked={t.done} onChange={(e) => toggle(wi, ti, e.target.checked)} />
                      <div className={t.done ? 'text-slate-400 line-through' : ''}>
                        <p>{t.title}</p>
                        <p className="text-xs text-slate-500">{t.day && <Badge color="blue">{t.day}</Badge>} {t.resource}</p>
                      </div>
                    </li>
                  ))}
                  {w.tasks.length === 0 && <Empty text="No tasks" />}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
