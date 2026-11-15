import { useEffect, useState, useCallback } from 'react';
import { X, Loader2, AlertCircle, Inbox } from 'lucide-react';
import { errMsg } from '../api';

export function useLoad(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setData(await fn()); } catch (e) { setError(errMsg(e)); } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { reload(); }, [reload]);
  return { data, setData, loading, error, reload };
}

export const Spinner = ({ className = '' }) => <Loader2 className={`animate-spin ${className}`} size={18} />;

export const PageLoader = () => (
  <div className="flex h-64 items-center justify-center text-brand-600"><Spinner className="h-8 w-8" /></div>
);

export const ErrorBox = ({ message, onRetry }) => (
  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
    <AlertCircle size={18} className="mt-0.5 shrink-0" />
    <div className="flex-1">{message}</div>
    {onRetry && <button onClick={onRetry} className="font-medium underline">Retry</button>}
  </div>
);

export const Notice = ({ children, tone = 'amber' }) => {
  const tones = { amber: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300', blue: 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-700/40 dark:bg-brand-700/10 dark:text-brand-200' };
  return <div className={`rounded-xl border p-3 text-sm ${tones[tone]}`}>{children}</div>;
};

export const Empty = ({ text = 'Nothing here yet.' }) => (
  <div className="flex flex-col items-center gap-2 py-10 text-slate-400"><Inbox size={32} /><p className="text-sm">{text}</p></div>
);

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3 animate-fadeUp">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
    <div className="flex flex-wrap gap-2">{actions}</div>
  </div>
);

export const Stat = ({ icon: Icon, label, value, hint, accent = 'brand' }) => {
  const c = accent === 'violet' ? 'bg-violet-100 text-violet-600 dark:bg-violet-500/20' : 'bg-brand-100 text-brand-600 dark:bg-brand-500/20';
  return (
    <div className="card animate-fadeUp">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        {Icon && <span className={`rounded-lg p-2 ${c}`}><Icon size={18} /></span>}
      </div>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
};

export const Progress = ({ value, className = '' }) => (
  <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700 ${className}`}>
    <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }} />
  </div>
);

const badgeColors = {
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  blue: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  gray: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};
export const Badge = ({ color = 'gray', children }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColors[color]}`}>{children}</span>
);

export const statusColor = (s) => ({ applied: 'blue', shortlisted: 'amber', selected: 'green', rejected: 'red', upcoming: 'blue', closed: 'gray', completed: 'green', Easy: 'green', Medium: 'amber', Hard: 'red', solved: 'green', attempted: 'amber', todo: 'gray' }[s] || 'gray');

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`card mt-10 w-full animate-fadeUp ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Field = ({ label, children }) => (
  <label className="block"><span className="label">{label}</span>{children}</label>
);

export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

export const CHART_COLORS = ['#2563eb', '#7c3aed', '#0ea5e9', '#a78bfa', '#14b8a6', '#f59e0b'];
