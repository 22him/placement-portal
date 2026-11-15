import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend } from 'recharts';
import api from '../../api';
import { useLoad, PageLoader, ErrorBox, PageHeader, Empty, fmtDate } from '../../components/ui';

const Chart = ({ title, empty, children }) => (
  <div className="card"><h2 className="mb-3 font-semibold">{title}</h2>{empty ? <Empty text="No data yet. Use this module to see your chart." /> : <div className="h-64">{children}</div>}</div>
);

export default function Analytics() {
  const { data, loading, error, reload } = useLoad(async () => (await api.get('/student/analytics')).data);
  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const { stats, resumeHistory } = data;

  const radar = [
    { area: 'Coding', value: stats.coding.percent },
    { area: 'Aptitude', value: stats.aptitude.average },
    { area: 'Interview', value: stats.interview.average },
    { area: 'Resume', value: stats.resume?.score || 0 },
  ];

  return (
    <>
      <PageHeader title="My analytics" subtitle="Every chart is drawn from your stored activity." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Chart title="Preparation overview">
          <ResponsiveContainer><RadarChart data={radar}><PolarGrid /><PolarAngleAxis dataKey="area" /><Radar dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.35} /><Tooltip /></RadarChart></ResponsiveContainer>
        </Chart>
        <Chart title="Coding progress by topic (%)" empty={!stats.coding.byTopic.length}>
          <ResponsiveContainer><BarChart data={stats.coding.byTopic}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="topic" fontSize={10} interval={0} angle={-20} height={60} textAnchor="end" /><YAxis domain={[0, 100]} fontSize={12} /><Tooltip /><Bar dataKey="percent" fill="#2563eb" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
        </Chart>
        <Chart title="Aptitude scores over time" empty={!stats.aptitude.history.length}>
          <ResponsiveContainer><LineChart data={stats.aptitude.history.map((h, i) => ({ n: `#${i + 1}`, percent: h.percent, date: fmtDate(h.date) }))}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="n" fontSize={12} /><YAxis domain={[0, 100]} fontSize={12} /><Tooltip /><Line dataKey="percent" stroke="#7c3aed" strokeWidth={3} /></LineChart></ResponsiveContainer>
        </Chart>
        <Chart title="Aptitude by category" empty={!stats.aptitude.byCategory.length}>
          <ResponsiveContainer><BarChart data={stats.aptitude.byCategory}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="category" fontSize={12} /><YAxis domain={[0, 100]} fontSize={12} /><Tooltip /><Bar dataKey="average" fill="#7c3aed" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
        </Chart>
        <Chart title="Resume score history" empty={!resumeHistory.length}>
          <ResponsiveContainer><LineChart data={resumeHistory.map((r) => ({ date: fmtDate(r.date), score: r.score }))}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="date" fontSize={11} /><YAxis domain={[0, 100]} fontSize={12} /><Tooltip /><Line dataKey="score" stroke="#2563eb" strokeWidth={3} /></LineChart></ResponsiveContainer>
        </Chart>
        <Chart title="Interview scores" empty={!stats.interview.history.length}>
          <ResponsiveContainer><LineChart data={stats.interview.history.map((h) => ({ date: fmtDate(h.date), score: h.score }))}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="date" fontSize={11} /><YAxis domain={[0, 100]} fontSize={12} /><Tooltip /><Line dataKey="score" stroke="#7c3aed" strokeWidth={3} /></LineChart></ResponsiveContainer>
        </Chart>
      </div>
    </>
  );
}
