import { useRef, useState } from 'react';
import { UploadCloud, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import api, { errMsg } from '../../api';
import { useApp } from '../../AppContext';
import { useLoad, PageLoader, ErrorBox, PageHeader, Field, Spinner, Progress, Badge, Notice, Empty, fmtDate } from '../../components/ui';

export default function Resume() {
  const { toast } = useApp();
  const meta = useLoad(async () => (await api.get('/student/resume/roles')).data);
  const list = useLoad(async () => (await api.get('/student/resume')).data);
  const [role, setRole] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const input = useRef();

  if (meta.loading || list.loading) return <PageLoader />;
  if (meta.error) return <ErrorBox message={meta.error} onRetry={meta.reload} />;

  const pick = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) return toast('Only PDF files are allowed', 'error');
    if (f.size > 5 * 1024 * 1024) return toast('File must be under 5 MB', 'error');
    setFile(f);
  };

  const analyze = async (e) => {
    e.preventDefault();
    if (!file) return toast('Choose a PDF resume first', 'error');
    if (!role) return toast('Select a target role', 'error');
    const fd = new FormData();
    fd.append('resume', file);
    fd.append('targetRole', role);
    setBusy(true);
    try {
      const { data } = await api.post('/student/resume/analyze', fd);
      setResult(data.resume);
      setFile(null);
      list.reload();
      toast('Resume analysed');
    } catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(false); }
  };

  const open = async (id) => {
    try { setResult((await api.get(`/student/resume/${id}`)).data.resume); window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (err) { toast(errMsg(err), 'error'); }
  };
  const del = async (id) => {
    if (!confirm('Delete this analysis?')) return;
    try { await api.delete(`/student/resume/${id}`); if (result?._id === id) setResult(null); list.reload(); } catch (err) { toast(errMsg(err), 'error'); }
  };

  const ai = result?.aiAnalysis;
  return (
    <>
      <PageHeader title="AI Resume Analyzer" subtitle="Score is calculated by a transparent rubric; AI adds skills, ATS and role-specific feedback." />
      <form onSubmit={analyze} className="card mb-5 grid gap-4 md:grid-cols-[1fr_16rem_auto] md:items-end">
        <div>
          <span className="label">Resume (PDF, max 5 MB)</span>
          <div onClick={() => input.current.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
            className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-sm transition hover:border-brand-500 dark:border-slate-700">
            <UploadCloud className="text-violet-500" /> {file ? file.name : 'Click or drag a PDF here'}
          </div>
          <input ref={input} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => pick(e.target.files[0])} />
        </div>
        <Field label="Target role">
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Select a role</option>
            {meta.data.roles.map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <button className="btn-primary" disabled={busy}>{busy && <Spinner />} Analyse</button>
      </form>

      {result && (
        <div className="mb-5 space-y-5 animate-fadeUp">
          {result.aiError && <Notice>AI feedback is unavailable: {result.aiError} The rule-based score below is still valid.</Notice>}
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="card text-center">
              <p className="text-sm text-slate-500">Resume score · {result.targetRole}</p>
              <p className="my-2 bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-6xl font-extrabold text-transparent">{result.score}</p>
              <Progress value={result.score} />
              {ai?.summary && <p className="mt-4 text-left text-sm text-slate-600 dark:text-slate-300">{ai.summary}</p>}
            </div>
            <div className="card lg:col-span-2">
              <h2 className="mb-3 font-semibold">How the score was calculated</h2>
              <div className="space-y-3">
                {result.breakdown.map((b) => (
                  <div key={b.category}>
                    <div className="flex justify-between text-sm"><span>{b.category}</span><span className="font-medium">{b.points}/{b.max}</span></div>
                    <Progress value={(b.points / b.max) * 100} className="my-1" />
                    <p className="text-xs text-slate-500">{b.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="card">
              <h3 className="mb-2 font-semibold">Skills found</h3>
              <div className="flex flex-wrap gap-2">{(ai?.technicalSkills?.length ? ai.technicalSkills : result.detectedSkills).map((s) => <Badge key={s} color="green">{s}</Badge>)}</div>
              {ai?.softSkills?.length > 0 && <><h3 className="mb-2 mt-4 font-semibold">Soft skills</h3><div className="flex flex-wrap gap-2">{ai.softSkills.map((s) => <Badge key={s} color="violet">{s}</Badge>)}</div></>}
            </div>
            <div className="card">
              <h3 className="mb-2 font-semibold">Missing for {result.targetRole}</h3>
              {result.missingSkills.length ? <div className="flex flex-wrap gap-2">{result.missingSkills.map((s) => <Badge key={s} color="red">{s}</Badge>)}</div> : <p className="text-sm text-slate-500">No expected skills missing.</p>}
            </div>
            {ai && [['Strengths', ai.strengths, CheckCircle2, 'text-emerald-500'], ['ATS-friendly suggestions', ai.atsSuggestions, XCircle, 'text-amber-500'], [`Improvements for ${result.targetRole}`, ai.roleImprovements, XCircle, 'text-violet-500']].map(([t, items, Icon, c]) => (
              items?.length > 0 && (
                <div key={t} className="card">
                  <h3 className="mb-2 font-semibold">{t}</h3>
                  <ul className="space-y-2 text-sm">{items.map((x, i) => <li key={i} className="flex gap-2"><Icon size={16} className={`mt-0.5 shrink-0 ${c}`} />{x}</li>)}</ul>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="mb-3 font-semibold">Previous analyses</h2>
        {list.data.items.length === 0 ? <Empty text="No resumes analysed yet." /> : (
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr><th className="th">File</th><th className="th">Role</th><th className="th">Score</th><th className="th">Date</th><th /></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.data.items.map((r) => (
                <tr key={r._id}>
                  <td className="td">{r.fileName}</td><td className="td">{r.targetRole}</td><td className="td font-semibold">{r.score}</td><td className="td">{fmtDate(r.createdAt)}</td>
                  <td className="td text-right"><button className="btn-ghost !py-1" onClick={() => open(r._id)}>View</button> <button className="btn-ghost !py-1 text-red-600" onClick={() => del(r._id)} aria-label="Delete"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody></table></div>
        )}
      </div>
    </>
  );
}
