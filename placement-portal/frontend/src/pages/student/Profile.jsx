import { useEffect, useState } from 'react';
import api, { errMsg } from '../../api';
import { useApp } from '../../AppContext';
import { useLoad, PageLoader, ErrorBox, PageHeader, Field, Spinner } from '../../components/ui';

export default function Profile() {
  const { toast, setUser } = useApp();
  const { data, loading, error, reload } = useLoad(async () => (await api.get('/student/profile')).data);
  const [f, setF] = useState(null);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    if (data) {
      const p = data.profile;
      setF({ name: data.user.name, rollNo: p.rollNo || '', branch: p.branch || '', year: p.year || '', cgpa: p.cgpa ?? '', backlogs: p.backlogs ?? 0, phone: p.phone || '', skills: (p.skills || []).join(', '), targetRoles: (p.targetRoles || []).join(', '), github: p.github || '', linkedin: p.linkedin || '' });
    }
  }, [data]);

  if (loading || !f) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return toast('Name is required', 'error');
    if (f.cgpa !== '' && (f.cgpa < 0 || f.cgpa > 10)) return toast('CGPA must be between 0 and 10', 'error');
    setBusy(true);
    try {
      await api.put('/student/profile', { ...f, year: f.year ? Number(f.year) : undefined, cgpa: f.cgpa === '' ? 0 : Number(f.cgpa), backlogs: Number(f.backlogs) || 0 });
      const u = { ...JSON.parse(localStorage.getItem('user')), name: f.name.trim() };
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
      toast('Profile saved');
    } catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(false); }
  };

  const changePw = async (e) => {
    e.preventDefault();
    setPwBusy(true);
    try {
      await api.put('/auth/password', pw);
      setPw({ currentPassword: '', newPassword: '' });
      toast('Password changed');
    } catch (err) { toast(errMsg(err), 'error'); } finally { setPwBusy(false); }
  };

  return (
    <>
      <PageHeader title="My profile" subtitle="Your academic details drive drive-eligibility and company matching." />
      <div className="grid gap-5 lg:grid-cols-3">
        <form onSubmit={save} className="card space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><input className="input" value={f.name} onChange={set('name')} /></Field>
            <Field label="Email"><input className="input opacity-60" value={data.user.email} disabled /></Field>
            <Field label="Roll number"><input className="input" value={f.rollNo} onChange={set('rollNo')} /></Field>
            <Field label="Branch"><input className="input" placeholder="CSE" value={f.branch} onChange={set('branch')} /></Field>
            <Field label="Year"><input className="input" type="number" min="1" max="6" value={f.year} onChange={set('year')} /></Field>
            <Field label="CGPA"><input className="input" type="number" step="0.01" min="0" max="10" value={f.cgpa} onChange={set('cgpa')} /></Field>
            <Field label="Active backlogs"><input className="input" type="number" min="0" value={f.backlogs} onChange={set('backlogs')} /></Field>
            <Field label="Phone"><input className="input" value={f.phone} onChange={set('phone')} /></Field>
            <Field label="GitHub"><input className="input" value={f.github} onChange={set('github')} /></Field>
            <Field label="LinkedIn"><input className="input" value={f.linkedin} onChange={set('linkedin')} /></Field>
          </div>
          <Field label="Skills (comma separated)"><input className="input" placeholder="java, sql, react" value={f.skills} onChange={set('skills')} /></Field>
          <Field label="Target roles (comma separated)"><input className="input" placeholder="Software Developer, Data Analyst" value={f.targetRoles} onChange={set('targetRoles')} /></Field>
          <button className="btn-primary" disabled={busy}>{busy && <Spinner />} Save profile</button>
        </form>
        <form onSubmit={changePw} className="card h-fit space-y-4">
          <h2 className="font-semibold">Change password</h2>
          <Field label="Current password"><input className="input" type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
          <Field label="New password"><input className="input" type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
          <button className="btn-primary" disabled={pwBusy}>{pwBusy && <Spinner />} Update password</button>
        </form>
      </div>
    </>
  );
}
