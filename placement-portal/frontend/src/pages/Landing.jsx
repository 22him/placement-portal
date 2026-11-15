import { Link } from 'react-router-dom';
import { GraduationCap, FileText, MessagesSquare, Brain, Code2, Map, Sparkles, BarChart3, Moon, Sun, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../AppContext';

const features = [
  [FileText, 'AI Resume Analyzer', 'Upload a PDF and get a transparent, rule-by-rule score plus ATS and role-specific feedback.'],
  [MessagesSquare, 'AI Mock Interviews', 'Technical, HR and company-specific questions with scored answers and improvement tips.'],
  [Brain, 'Aptitude Practice', 'Quant, logical and verbal tests, timed quizzes and full mock placement tests.'],
  [Code2, 'Coding Practice', 'Topic-wise DSA questions with progress tracking and weak-topic recommendations.'],
  [Map, 'Personalised Roadmap', 'Weekly plans generated from your real performance, with daily progress tracking.'],
  [Sparkles, 'Company Matching', 'See your match percentage per company and exactly what you are missing.'],
];

export default function Landing() {
  const { user, dark, setDark } = useApp();
  const home = user ? (user.role === 'admin' ? '/admin' : '/student') : '/login';
  return (
    <div className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2 text-lg font-bold"><GraduationCap className="text-violet-600" /> PlacePrep <span className="text-brand-600">AI</span></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDark(!dark)} className="btn-ghost !px-2.5" aria-label="Toggle theme">{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
          <Link to="/login?admin=1" className="btn-ghost hidden sm:inline-flex"><ShieldCheck size={16} /> Placement Officer</Link>
          {user ? <Link to={home} className="btn-primary">Open dashboard</Link> : <Link to="/login" className="btn-primary">Log in</Link>}
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-10 text-center sm:px-6 sm:pt-20">
        <div className="pointer-events-none absolute -top-10 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-400/30 blur-3xl animate-float" />
        <div className="pointer-events-none absolute right-10 top-32 h-56 w-56 rounded-full bg-brand-400/30 blur-3xl animate-float" />
        <span className="relative inline-block rounded-full bg-violet-100 px-4 py-1 text-xs font-medium text-violet-700 dark:bg-violet-500/20 dark:text-violet-300 animate-fadeUp">Campus placements, organised</span>
        <h1 className="relative mx-auto mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl animate-fadeUp">
          Prepare smarter. Get <span className="bg-gradient-to-r from-brand-600 to-violet-600 bg-clip-text text-transparent">placed faster.</span>
        </h1>
        <p className="relative mx-auto mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-300 animate-fadeUp">
          One platform where students prepare with AI and placement officers manage companies, drives and results.
        </p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3 animate-fadeUp">
          <Link to="/register" className="btn-primary !px-6 !py-3">Get started free <ArrowRight size={16} /></Link>
          <Link to="/login" className="btn-ghost !px-6 !py-3">I already have an account</Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([Icon, title, text]) => (
            <div key={title} className="card transition hover:-translate-y-1 hover:shadow-lg animate-fadeUp">
              <span className="mb-3 inline-flex rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 p-2.5 text-white"><Icon size={20} /></span>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{text}</p>
            </div>
          ))}
        </div>
        <div className="card mt-8 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-brand-600 to-violet-600 !border-0 text-white">
          <div className="flex items-center gap-3"><BarChart3 /> <p className="font-medium">Placement officers get live analytics, eligibility checks and one-click CSV reports.</p></div>
          <Link to="/login?admin=1" className="btn bg-white text-violet-700 hover:bg-violet-50">Officer login</Link>
        </div>
      </section>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800">© {new Date().getFullYear()} PlacePrep AI</footer>
    </div>
  );
}
