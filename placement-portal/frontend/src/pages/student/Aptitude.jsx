import { useEffect, useRef, useState } from 'react';
import { Clock, Sparkles } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api, { errMsg } from '../../api';
import { useApp } from '../../AppContext';
import { useLoad, PageLoader, ErrorBox, PageHeader, Badge, Empty, Spinner, Progress, Notice, fmtDate } from '../../components/ui';

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function Aptitude() {
  const { toast } = useApp();
  const [filters, setFilters] = useState({ category: '', type: '', search: '' });
  const tests = useLoad(async () => (await api.get('/student/aptitude/tests', { params: filters })).data, [filters.category, filters.type, filters.search]);
  const recs = useLoad(async () => (await api.get('/student/aptitude/recommendations')).data);
  const [aiAdvice, setAiAdvice] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [active, setActive] = useState(null); // { test, answers, left }
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const started = useRef(0);

  const finish = async (state = active) => {
    if (!state || submitting) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/student/aptitude/tests/${state.test._id}/submit`, { answers: state.answers, timeTakenSecs: Math.round((Date.now() - started.current) / 1000) });
      setResult(data); setActive(null); tests.reload(); recs.reload();
    } catch (err) { toast(errMsg(err), 'error'); } finally { setSubmitting(false); }
  };

  useEffect(() => {
    if (!active) return;
    if (active.left <= 0) { toast("Time's up! Submitting your test.", 'error'); finish(active); return; }
    const t = setTimeout(() => setActive((a) => a && { ...a, left: a.left - 1 }), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.left, !!active]);

  const begin = async (id) => {
    try {
      const { data } = await api.get(`/student/aptitude/tests/${id}`);
      started.current = Date.now();
      setResult(null);
      setActive({ test: data.test, answers: data.test.questions.map(() => -1), left: data.test.durationMins * 60, idx: 0 });
    } catch (err) { toast(errMsg(err), 'error'); }
  };

  const getAdvice = async () => {
    setAiBusy(true);
    try { setAiAdvice((await api.get('/student/aptitude/recommendations', { params: { ai: 1 } })).data); } catch (err) { toast(errMsg(err), 'error'); } finally { setAiBusy(false); }
  };

  if (active) {
    const { test, answers, left, idx } = active;
    const q = test.questions[idx];
    return (
      <>
        <PageHeader title={test.title} subtitle={`Question ${idx + 1} of ${test.questions.length}`}
          actions={<><span className={`btn-ghost ${left < 60 ? '!text-red-600' : ''}`}><Clock size={16} /> {mmss(left)}</span><button className="btn-primary" disabled={submitting} onClick={() => confirm('Submit the test now?') && finish()}>{submitting && <Spinner />} Submit</button></>} />
        <Progress value={((idx + 1) / test.questions.length) * 100} className="mb-5" />
        <div className="card space-y-4">
          <p className="text-lg font-medium">{q.text}</p>
          <div className="space-y-2">
            {q.options.map((o, i) => (
              <button key={i} onClick={() => setActive({ ...active, answers: answers.map((a, k) => (k === idx ? i : a)) })}
                className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${answers[idx] === i ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 hover:border-slate-400 dark:border-slate-700'}`}>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold dark:bg-slate-800">{String.fromCharCode(65 + i)}</span>{o}
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <button className="btn-ghost" disabled={idx === 0} onClick={() => setActive({ ...active, idx: idx - 1 })}>Previous</button>
            <button className="btn-ghost" onClick={() => setActive({ ...active, answers: answers.map((a, k) => (k === idx ? -1 : a)) })}>Clear</button>
            <button className="btn-ghost" disabled={idx === test.questions.length - 1} onClick={() => setActive({ ...active, idx: idx + 1 })}>Next</button>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            {answers.map((a, i) => <button key={i} onClick={() => setActive({ ...active, idx: i })} className={`h-8 w-8 rounded-md text-xs font-medium ${i === idx ? 'ring-2 ring-brand-500' : ''} ${a >= 0 ? 'bg-brand-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>{i + 1}</button>)}
          </div>
        </div>
      </>
    );
  }

  if (result) {
    const r = result.result;
    return (
      <>
        <PageHeader title="Test result" subtitle={result.testTitle} actions={<button className="btn-primary" onClick={() => setResult(null)}>Back to tests</button>} />
        <div className="mb-5 grid gap-5 sm:grid-cols-3">
          <div className="card text-center"><p className="text-sm text-slate-500">Score</p><p className="text-4xl font-bold">{r.score}/{r.total}</p></div>
          <div className="card text-center"><p className="text-sm text-slate-500">Percentage</p><p className="text-4xl font-bold">{r.percent}%</p></div>
          <div className="card text-center"><p className="text-sm text-slate-500">Time taken</p><p className="text-4xl font-bold">{mmss(r.timeTakenSecs)}</p></div>
        </div>
        <div className="card mb-5"><h2 className="mb-3 font-semibold">Topic accuracy</h2>
          <div className="h-56"><ResponsiveContainer><BarChart data={r.topicBreakdown.map((t) => ({ topic: t.topic, percent: Math.round((t.correct / t.total) * 100) }))}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="topic" fontSize={11} /><YAxis domain={[0, 100]} fontSize={12} /><Tooltip /><Bar dataKey="percent" fill="#7c3aed" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
        <div className="space-y-3">
          {result.review.map((q, i) => (
            <div key={i} className="card">
              <p className="font-medium">{i + 1}. {q.text} <Badge color={q.correct ? 'green' : q.chosen === -1 ? 'gray' : 'red'}>{q.correct ? 'Correct' : q.chosen === -1 ? 'Skipped' : 'Wrong'}</Badge></p>
              <p className="mt-2 text-sm">Your answer: {q.chosen >= 0 ? q.options[q.chosen] : '—'}</p>
              {!q.correct && <p className="text-sm text-emerald-600">Correct answer: {q.options[q.correctIndex]}</p>}
              {q.explanation && <p className="mt-1 text-xs text-slate-500">{q.explanation}</p>}
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Aptitude preparation" subtitle="Topic-wise practice, timed quizzes and mock placement tests." />
      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">Recommended for you</h2>
            <button className="btn-ghost !py-1" onClick={getAdvice} disabled={aiBusy}>{aiBusy ? <Spinner /> : <Sparkles size={14} />} AI study advice</button></div>
          {recs.data?.weakTopics?.length > 0 ? <p className="mb-2 text-sm text-slate-500">Weak topics: {recs.data.weakTopics.map((t) => <Badge key={t} color="red">{t}</Badge>)}</p> : <p className="mb-2 text-sm text-slate-500">Take a few tests and your weak topics will appear here.</p>}
          <div className="flex flex-wrap gap-2">{recs.data?.suggested?.slice(0, 3).map((t) => <button key={t._id} onClick={() => begin(t._id)} className="btn-ghost !py-1.5">{t.title}</button>)}</div>
          {aiAdvice?.aiError && <div className="mt-3"><Notice>{aiAdvice.aiError}</Notice></div>}
          {aiAdvice?.aiAdvice && <div className="mt-3 whitespace-pre-wrap rounded-lg bg-violet-50 p-3 text-sm dark:bg-violet-500/10">{aiAdvice.aiAdvice}</div>}
        </div>
        <div className="card"><h2 className="mb-2 font-semibold">Filters</h2>
          <div className="space-y-2">
            <input className="input" placeholder="Search tests" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
            <select className="input" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}><option value="">All categories</option><option>Quantitative</option><option>Logical</option><option>Verbal</option><option>Mixed</option></select>
            <select className="input" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}><option value="">Practice and mock</option><option value="practice">Practice</option><option value="mock">Mock tests</option></select>
          </div></div>
      </div>
      {tests.loading ? <PageLoader /> : tests.error ? <ErrorBox message={tests.error} onRetry={tests.reload} /> : tests.data.items.length === 0 ? <Empty text="No tests match your filters." /> : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tests.data.items.map((t) => (
            <div key={t._id} className="card flex flex-col transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-2 flex gap-2"><Badge color="blue">{t.category}</Badge><Badge color={t.type === 'mock' ? 'violet' : 'gray'}>{t.type}</Badge></div>
              <h3 className="font-semibold">{t.title}</h3>
              <p className="mt-1 text-xs text-slate-500">{t.questionCount} questions · {t.durationMins} min{t.bestPercent !== null && ` · Best ${t.bestPercent}%`}</p>
              <button className="btn-primary mt-4" onClick={() => begin(t._id)}>{t.bestPercent !== null ? 'Retake' : 'Start'} test</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
