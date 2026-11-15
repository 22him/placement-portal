import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import api, { errMsg } from '../../api';
import { useApp } from '../../AppContext';
import { useLoad, PageLoader, ErrorBox, PageHeader, Modal, Field, Spinner, Empty, Badge } from '../../components/ui';

export default function AdminStudents() {
  const { toast } = useApp();
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('');
  const list = useLoad(async () => (await api.get('/admin/students', { params: { search, branch } })).data, [search, branch]);
  const [ed, setEd] = useState(null);
  const [busy, setBusy] = useState(false);

  const open = (s) => setEd({ id: s._id, name: s.name, active: s.active, rollNo: s.profile.rollNo || '', branch: s.profile.branch || '', year: s.profile.year || '', cgpa: s.profile.cgpa ?? 0, backlogs: s.profile.backlogs ?? 0, skills: (s.profile.skills || []).join(', '), placed: !!s.profile.placed });
  const set = (k) => (e) => setEd({ ...ed, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const save = async (e) => {
    e.preventDefault();
    if (!ed.name.trim()) return toast('Name is required', 'error');
    if (ed.cgpa < 0 || ed.cgpa > 10) return toast('CGPA must be between 0 and 10', 'error');
    setBusy(true);
    try {
      await api.put(`/admin/students/${ed.id}`, { ...ed, year: ed.year ? Number(ed.year) : undefined, cgpa: Number(ed.cgpa), backlogs: Number(ed.backlogs) });
      toast('Student updated'); setEd(null); list.reload();
    } catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(false); }
  };
  const del = async (s) => {
    if (!confirm(`Delete ${s.name} and all their applications? This cannot be undone.`)) return;
    try { await api.delete(`/admin/students/${s._id}`); toast('Student deleted'); list.reload(); } catch (err) { toast(errMsg(err), 'error'); }
  };

  return (
    <>
      <PageHeader title="Students" subtitle="View and manage student profiles." />
      <div className="card">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <input className="input sm:col-span-2" placeholder="Search by name, email or roll number" value={search} onChange={(e) => setSearch(e.target.value)} />
          <input className="input" placeholder="Filter by branch (e.g. CSE)" value={branch} onChange={(e) => setBranch(e.target.value)} />
        </div>
        {list.loading && !list.data ? <PageLoader /> : list.error ? <ErrorBox message={list.error} onRetry={list.reload} /> : list.data.items.length === 0 ? <Empty text="No students found." /> : (
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr><th className="th">Student</th><th className="th">Roll no</th><th className="th">Branch</th><th className="th">CGPA</th><th className="th">Backlogs</th><th className="th">Status</th><th /></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.data.items.map((s) => (
                <tr key={s._id}>
                  <td className="td"><p className="font-medium">{s.name}</p><p className="text-xs text-slate-500">{s.email}</p></td>
                  <td className="td">{s.profile.rollNo || '—'}</td><td className="td">{s.profile.branch || '—'}</td><td className="td">{s.profile.cgpa ?? '—'}</td><td className="td">{s.profile.backlogs ?? 0}</td>
                  <td className="td">{s.profile.placed ? <Badge color="green">Placed</Badge> : <Badge>Unplaced</Badge>} {!s.active && <Badge color="red">Disabled</Badge>}</td>
                  <td className="td whitespace-nowrap text-right"><button className="btn-ghost !py-1" onClick={() => open(s)} aria-label="Edit"><Pencil size={14} /></button> <button className="btn-ghost !py-1 text-red-600" onClick={() => del(s)} aria-label="Delete"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody></table></div>
        )}
      </div>
      {ed && (
        <Modal title="Edit student" onClose={() => setEd(null)} wide>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Name"><input className="input" value={ed.name} onChange={set('name')} /></Field>
            <Field label="Roll number"><input className="input" value={ed.rollNo} onChange={set('rollNo')} /></Field>
            <Field label="Branch"><input className="input" value={ed.branch} onChange={set('branch')} /></Field>
            <Field label="Year"><input className="input" type="number" min="1" max="6" value={ed.year} onChange={set('year')} /></Field>
            <Field label="CGPA"><input className="input" type="number" step="0.01" min="0" max="10" value={ed.cgpa} onChange={set('cgpa')} /></Field>
            <Field label="Backlogs"><input className="input" type="number" min="0" value={ed.backlogs} onChange={set('backlogs')} /></Field>
            <div className="sm:col-span-2"><Field label="Skills (comma separated)"><input className="input" value={ed.skills} onChange={set('skills')} /></Field></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-violet-600" checked={ed.placed} onChange={set('placed')} /> Placed</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-violet-600" checked={ed.active} onChange={set('active')} /> Account active</label>
            <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className="btn-ghost" onClick={() => setEd(null)}>Cancel</button><button className="btn-primary" disabled={busy}>{busy && <Spinner />} Save</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
