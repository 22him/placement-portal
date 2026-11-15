import { Link } from 'react-router-dom';
import { Target, Code2, Brain, MessagesSquare, FileText, ArrowRight, CalendarDays } from 'lucide-react';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import api from '../../api';
import { useLoad, PageLoader, ErrorBox, PageHeader, Stat, Progress, Badge, Empty, Notice, fmtDate, statusColor } from '../../components/ui';

export default function Dashboard() {
  const { data, loading, error, reload } = useLoad(async () => (await api.get('/student/dashboard')).data);
  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const { stats, upcomingDrives, activities, applications, profileComplete } = data;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Your preparation at a glance, calculated from your real activity." />
      {!profileComplete && (
        <div className="mb-5"><Notice>Complete your profile (branch, CGPA, skills) so drive eligibility and company matches are accurate. <Link to="/student/profile" className="font-medium underline">Update profile</Link></Notice></div>
      )}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card flex items-center gap-4 animate-fadeUp">
          <div className="h-32 w-32 shrink-0">
            <ResponsiveContainer>
              <RadialBarChart innerRadius="75%" outerRadius="100%" data={[{ v: stats.preparationProgress }]} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="v" cornerRadius={10} fill="#7c3aed" background />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-sm text-slate-500">Total preparation</p>
            <p className="text-4xl font-bold">{stats.preparationProgress}%</p>
            <p className="mt-1 text-xs text-slate-500">Coding 30% · Aptitude 30% · Interview 20% · Resume 20%</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
          <Stat icon={Code2} label="Coding solved" value={`${stats.coding.solved}/${stats.coding.total}`} hint={`${stats.coding.percent}% of the question bank`} />
          <Stat icon={Brain} accent="violet" label="Aptitude average" value={`${stats.aptitude.average}%`} hint={`${stats.aptitude.testsTaken} tests taken`} />
          <Stat icon={MessagesSquare} label="Interview average" value={`${stats.interview.average}%`} hint={`${stats.interview.sessions} completed sessions`} />
          <Stat icon={FileText} accent="violet" label="Resume score" value={stats.resume ? `${stats.resume.score}/100` : '—'} hint={stats.resume ? `For ${stats.resume.targetRole}` : 'Not analysed yet'} />
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="card">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Upcoming placement drives</h2><Link to="/student/drives" className="text-sm text-brand-600">View all</Link></div>
          {upcomingDrives.length === 0 ? <Empty text="No upcoming drives." /> : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {upcomingDrives.map((d) => (
                <li key={d._id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{d.company?.name} <span className="text-slate-400">·</span> {d.role}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-500"><CalendarDays size={12} /> Drive {fmtDate(d.driveDate)} · Apply by {fmtDate(d.deadline)}</p>
                  </div>
                  {d.applicationStatus ? <Badge color={statusColor(d.applicationStatus)}>{d.applicationStatus}</Badge> : d.eligible ? <Badge color="green">Eligible</Badge> : <Badge color="red">Not eligible</Badge>}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-slate-500">Applications: {applications.total} · Shortlisted: {applications.shortlisted} · Selected: {applications.selected}</p>
        </div>

        <div className="card">
          <h2 className="mb-1 font-semibold">Recommended activities</h2>
          <p className="mb-3 text-xs text-slate-500">Suggestions based on your weak areas and unfinished modules.</p>
          {activities.length === 0 ? <Empty text="You are on track. Keep practising!" /> : (
            <ul className="space-y-2">
              {activities.map((a, i) => (
                <li key={i}>
                  <Link to={a.to} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition hover:border-brand-400 hover:bg-brand-50 dark:border-slate-800 dark:hover:bg-slate-800">
                    <span className="flex items-center gap-2"><Target size={14} className="text-violet-500" /> {a.text}</span><ArrowRight size={14} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card mt-5">
        <h2 className="mb-3 font-semibold">Coding progress by topic</h2>
        {stats.coding.byTopic.length === 0 ? <Empty text="No questions available." /> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.coding.byTopic.map((t) => (
              <div key={t.topic}>
                <div className="mb-1 flex justify-between text-xs"><span>{t.topic}</span><span className="text-slate-500">{t.solved}/{t.total}</span></div>
                <Progress value={t.percent} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
