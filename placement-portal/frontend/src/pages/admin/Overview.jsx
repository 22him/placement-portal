import { Users, Trophy, CalendarCheck, ClipboardList, FileText, MessagesSquare } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import api from '../../api';
import { useLoad, PageLoader, ErrorBox, PageHeader, Stat, Empty, CHART_COLORS } from '../../components/ui';

const Chart = ({ title, empty, children }) => (
  <div className="card"><h2 className="mb-3 font-semibold">{title}</h2>{empty ? <Empty text="No data yet." /> : <div className="h-64">{children}</div>}</div>
);

export default function AdminOverview() {
  const { data, loading, error, reload } = useLoad(async () => (await api.get('/admin/analytics')).data);
  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const t = data.totals;

  return (
    <>
      <PageHeader title="Placement overview" subtitle="Live statistics across students, drives and applications." />
      <div className="mb-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Stat icon={Users} label="Students" value={t.students} />
        <Stat icon={Trophy} accent="violet" label="Placed" value={t.placed} hint={`${t.placementRate}% placement rate`} />
        <Stat icon={CalendarCheck} label="Upcoming drives" value={t.upcomingDrives} hint={`${t.drives} total drives`} />
        <Stat icon={ClipboardList} accent="violet" label="Applications" value={t.applications} />
        <Stat icon={FileText} label="Avg resume score" value={t.avgResumeScore || '—'} />
        <Stat icon={MessagesSquare} accent="violet" label="Avg interview score" value={t.avgInterviewScore ? `${t.avgInterviewScore}%` : '—'} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Chart title="Company-wise applications" empty={!data.byCompany.length}>
          <ResponsiveContainer><BarChart data={data.byCompany}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="company" fontSize={10} interval={0} angle={-15} height={55} textAnchor="end" /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Legend /><Bar dataKey="applications" fill="#2563eb" radius={[6, 6, 0, 0]} /><Bar dataKey="selected" fill="#7c3aed" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
        </Chart>
        <Chart title="Application outcomes" empty={!data.statusCount.some((s) => s.count)}>
          <ResponsiveContainer><PieChart><Pie data={data.statusCount} dataKey="count" nameKey="status" innerRadius={55} outerRadius={90} label>{data.statusCount.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
        </Chart>
        <Chart title="Branch-wise placement" empty={!data.branchPlacement.length}>
          <ResponsiveContainer><BarChart data={data.branchPlacement}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="branch" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Legend /><Bar dataKey="total" fill="#60a5fa" radius={[6, 6, 0, 0]} /><Bar dataKey="placed" fill="#7c3aed" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
        </Chart>
        <Chart title="Resume score distribution (students)" empty={!data.resumeBands.some((b) => b.students)}>
          <ResponsiveContainer><BarChart data={data.resumeBands}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="band" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Bar dataKey="students" fill="#7c3aed" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
        </Chart>
        <Chart title="Coding questions solved (students)" empty={!data.codingBands.some((b) => b.students)}>
          <ResponsiveContainer><BarChart data={data.codingBands}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="band" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Bar dataKey="students" fill="#2563eb" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
        </Chart>
        <Chart title="Average aptitude score by category" empty={!data.aptitudeByCategory.length}>
          <ResponsiveContainer><BarChart data={data.aptitudeByCategory}><CartesianGrid strokeDasharray="3 3" opacity={0.3} /><XAxis dataKey="category" fontSize={12} /><YAxis domain={[0, 100]} fontSize={12} /><Tooltip /><Bar dataKey="average" fill="#a78bfa" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
        </Chart>
      </div>
    </>
  );
}
