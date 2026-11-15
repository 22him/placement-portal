import { useState } from 'react';
import { NavLink, Outlet, Navigate, Link } from 'react-router-dom';
import { LayoutDashboard, FileText, MessagesSquare, Brain, Code2, Map, Briefcase, Sparkles, BarChart3, User, Users, Building2, CalendarCheck, ClipboardList, FileDown, BookOpen, Menu, Moon, Sun, LogOut, GraduationCap } from 'lucide-react';
import { useApp } from '../AppContext';

const studentNav = [
  ['/student', 'Dashboard', LayoutDashboard, true],
  ['/student/resume', 'Resume Analyzer', FileText],
  ['/student/interview', 'Mock Interview', MessagesSquare],
  ['/student/aptitude', 'Aptitude', Brain],
  ['/student/coding', 'Coding Practice', Code2],
  ['/student/roadmap', 'Learning Roadmap', Map],
  ['/student/drives', 'Placement Drives', Briefcase],
  ['/student/recommendations', 'Company Match', Sparkles],
  ['/student/analytics', 'Analytics', BarChart3],
  ['/student/profile', 'Profile', User],
];
const adminNav = [
  ['/admin', 'Overview', LayoutDashboard, true],
  ['/admin/students', 'Students', Users],
  ['/admin/companies', 'Companies', Building2],
  ['/admin/drives', 'Drives', CalendarCheck],
  ['/admin/applications', 'Applications', ClipboardList],
  ['/admin/coding', 'Coding Questions', BookOpen],
  ['/admin/reports', 'Reports', FileDown],
];

export function RequireRole({ role }) {
  const { user } = useApp();
  if (!user) return <Navigate to={role === 'admin' ? '/login?admin=1' : '/login'} replace />;
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;
  return <Layout nav={role === 'admin' ? adminNav : studentNav} />;
}

function Layout({ nav }) {
  const { user, logout, dark, setDark } = useApp();
  const [open, setOpen] = useState(false);

  const links = (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map(([to, label, Icon, end]) => (
        <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
          className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>
          <Icon size={18} /> {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
        <Link to="/" className="flex items-center gap-2 px-6 py-5 text-lg font-bold"><GraduationCap className="text-violet-600" /> PlacePrep <span className="text-brand-600">AI</span></Link>
        {links}
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/50" />
          <aside className="relative h-full w-64 bg-white dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-6 py-5 text-lg font-bold"><GraduationCap className="text-violet-600" /> PlacePrep AI</div>
            {links}
          </aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 sm:px-6">
          <button className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="hidden text-sm text-slate-500 lg:block">Welcome back, <span className="font-semibold text-slate-800 dark:text-slate-100">{user.name}</span> <span className="ml-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700 dark:bg-violet-500/20 dark:text-violet-300">{user.role === 'admin' ? 'Placement Officer' : 'Student'}</span></div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDark(!dark)} className="btn-ghost !px-2.5" aria-label="Toggle theme">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
            <button onClick={logout} className="btn-ghost"><LogOut size={16} /> <span className="hidden sm:inline">Logout</span></button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
