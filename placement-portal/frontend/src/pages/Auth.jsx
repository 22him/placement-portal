import { useState } from 'react';
import { Link, useNavigate, useSearchParams, useParams, Navigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import api, { errMsg } from '../api';
import { useApp } from '../AppContext';
import { Spinner, Field, Notice } from '../components/ui';

function Shell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-violet-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md animate-fadeUp">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-xl font-bold"><GraduationCap className="text-violet-600" /> PlacePrep <span className="text-brand-600">AI</span></Link>
        <div className="card !p-7">
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="mb-5 mt-1 text-sm text-slate-500">{subtitle}</p>
          {children}
        </div>
        <div className="mt-4 text-center text-sm text-slate-500">{footer}</div>
      </div>
    </div>
  );
}

const Err = ({ text }) => (text ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{text}</p> : null);

export function Login() {
  const { user, login } = useApp();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [admin, setAdmin] = useState(params.get('admin') === '1');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) return setError('Enter your email and password');
    setBusy(true);
    try {
      await login(admin ? '/auth/admin/login' : '/auth/login', form);
      nav(admin ? '/admin' : '/student');
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <Shell title="Welcome back" subtitle={admin ? 'Placement officer sign in' : 'Student sign in'}
      footer={<>{!admin && <>New here? <Link to="/register" className="font-medium text-brand-600">Create an account</Link></>}</>}>
      <div className="mb-4 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm dark:bg-slate-800">
        {[['Student', false], ['Placement Officer', true]].map(([l, v]) => (
          <button key={l} type="button" onClick={() => { setAdmin(v); setError(''); }} className={`rounded-md py-1.5 font-medium transition ${admin === v ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-500'}`}>{l}</button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email"><input className="input" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Password"><input className="input" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <Err text={error} />
        <button className="btn-primary w-full" disabled={busy}>{busy && <Spinner />} Log in</button>
        <div className="text-right"><Link to="/forgot-password" className="text-xs text-brand-600">Forgot password?</Link></div>
      </form>
    </Shell>
  );
}

export function Register() {
  const { saveSession, user } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', rollNo: '', branch: '', year: '', cgpa: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/student" replace />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!f.name.trim()) return setError('Name is required');
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setError('Enter a valid email');
    if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) return setError('Password needs 8+ characters with letters and numbers');
    if (f.cgpa !== '' && (f.cgpa < 0 || f.cgpa > 10)) return setError('CGPA must be between 0 and 10');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/register', { ...f, year: f.year ? Number(f.year) : undefined, cgpa: f.cgpa ? Number(f.cgpa) : 0 });
      saveSession(data);
      nav('/student/profile');
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <Shell title="Create your account" subtitle="Students only. Placement officer accounts are created by the college." footer={<>Already registered? <Link to="/login" className="font-medium text-brand-600">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Full name"><input className="input" value={f.name} onChange={set('name')} /></Field>
        <Field label="Email"><input className="input" type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Password"><input className="input" type="password" value={f.password} onChange={set('password')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Roll number"><input className="input" value={f.rollNo} onChange={set('rollNo')} /></Field>
          <Field label="Branch"><input className="input" placeholder="CSE" value={f.branch} onChange={set('branch')} /></Field>
          <Field label="Year"><input className="input" type="number" min="1" max="6" value={f.year} onChange={set('year')} /></Field>
          <Field label="CGPA"><input className="input" type="number" step="0.01" min="0" max="10" value={f.cgpa} onChange={set('cgpa')} /></Field>
        </div>
        <Err text={error} />
        <button className="btn-primary w-full" disabled={busy}>{busy && <Spinner />} Create account</button>
      </form>
    </Shell>
  );
}

export function Forgot() {
  const [email, setEmail] = useState('');
  const [res, setRes] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try { setRes((await api.post('/auth/forgot-password', { email })).data); } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <Shell title="Forgot password" subtitle="Enter your email and we will generate a reset link." footer={<Link to="/login" className="text-brand-600">Back to login</Link>}>
      {res ? (
        <div className="space-y-3">
          <Notice tone="blue">{res.message}</Notice>
          {res.devResetLink && (
            <Notice>Development mode: no email service is configured, so use this link directly: <Link className="break-all font-medium underline" to={res.devResetLink.replace(/^https?:\/\/[^/]+/, '')}>{res.devResetLink}</Link></Notice>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Err text={error} />
          <button className="btn-primary w-full" disabled={busy}>{busy && <Spinner />} Send reset link</button>
        </form>
      )}
    </Shell>
  );
}

export function Reset() {
  const { token } = useParams();
  const nav = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return setError('Password needs 8+ characters with letters and numbers');
    setBusy(true);
    try { await api.post(`/auth/reset-password/${token}`, { password }); nav('/login'); } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <Shell title="Set a new password" subtitle="Choose a strong password." footer={<Link to="/login" className="text-brand-600">Back to login</Link>}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="New password"><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <Err text={error} />
        <button className="btn-primary w-full" disabled={busy}>{busy && <Spinner />} Update password</button>
      </form>
    </Shell>
  );
}
