import { useState } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import api, { errMsg } from '../../api';
import { useApp } from '../../AppContext';
import { useLoad, PageLoader, ErrorBox, PageHeader, Badge, Empty, Progress, Spinner, Notice } from '../../components/ui';

export default function Recommendations() {
  const { toast } = useApp();
  const { data, loading, error, reload, setData } = useLoad(async () => (await api.get('/student/recommendations/companies')).data);
  const [busy, setBusy] = useState(false);

  const explain = async () => {
    setBusy(true);
    try { setData((await api.get('/student/recommendations/companies', { params: { ai: 1 } })).data); } catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(false); }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  return (
    <>
      <PageHeader title="Company match" subtitle="Match % = skills 50 + CGPA 20 + branch 15 + backlogs 15 (uses your profile and resume skills)."
        actions={<button className="btn-primary" onClick={explain} disabled={busy}>{busy ? <Spinner /> : <Sparkles size={16} />} Explain top matches with AI</button>} />
      {data.aiError && <div className="mb-4"><Notice>AI explanation unavailable: {data.aiError}</Notice></div>}
      {data.items.length === 0 ? <Empty text="No companies have been added yet." /> : (
        <div className="grid gap-5 lg:grid-cols-2">
          {data.items.map((m) => (
            <div key={m.company._id} className="card animate-fadeUp">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div><h3 className="font-semibold">{m.company.name}</h3><p className="text-xs text-slate-500">{m.company.industry} · {m.company.packageLPA ? `${m.company.packageLPA} LPA` : 'CTC n/a'} · {m.company.roles?.join(', ')}</p></div>
                <div className="text-right"><p className="text-2xl font-bold text-violet-600">{m.matchPercent}%</p><Badge color={m.eligible ? 'green' : 'red'}>{m.eligible ? 'Eligible' : 'Not eligible'}</Badge></div>
              </div>
              <Progress value={m.matchPercent} className="mb-3" />
              <div className="space-y-2 text-sm">
                {m.reasons.map((r, i) => <p key={i} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />{r}</p>)}
                {m.missingEligibility.map((r, i) => <p key={i} className="flex gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />{r}</p>)}
                {m.missingSkills.length > 0 && <div><p className="label mt-2">Skills to add</p><div className="flex flex-wrap gap-1">{m.missingSkills.map((s) => <Badge key={s} color="amber">{s}</Badge>)}</div></div>}
              </div>
              {m.aiExplanation && (
                <div className="mt-3 rounded-lg bg-violet-50 p-3 text-sm dark:bg-violet-500/10">
                  <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-violet-600"><Sparkles size={12} /> AI explanation</p>
                  <p>{m.aiExplanation.why}</p>
                  {m.aiExplanation.nextSteps?.length > 0 && <ul className="mt-2 list-disc pl-5 text-xs">{m.aiExplanation.nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ul>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
