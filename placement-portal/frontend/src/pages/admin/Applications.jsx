import { useState } from 'react';
import api, { errMsg } from '../../api';
import { useApp } from '../../AppContext';
import { useLoad, PageLoader, ErrorBox, PageHeader, Badge, Empty, statusColor, fmtDate } from '../../components/ui';

export default function AdminApplications() {
  const { toast } = useApp();
  const [f, setF] = useState({ drive: '', status: '' });
  const drives = useLoad(async () => (await api.get('/admin/drives')).data);
  const list = useLoad(async () => (await api.get('/admin/applications', { params: f })).data, [f.drive, f.status]);

  const update = async (id, status) => {
    try { await api.put(`/admin/applications/${id}`, { status }); toast(`Marked ${status}`); list.reload(); } catch (err) { toast(errMsg(err), 'error'); }
  };

  return (
    <>
      <PageHeader title="Applications" subtitle="Review applicants, shortlist and record final selections." />
      <div className="card">
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <select className="input" value={f.drive} onChange={(e) => setF({ ...f, drive: e.target.value })}><option value="">All drives</option>{drives.data?.items.map((d) => <option key={d._id} value={d._id}>{d.title}</option>)}</select>
          <select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">All statuses</option>{['applied', 'shortlisted', 'selected', 'rejected'].map((s) => <option key={s}>{s}</option>)}</select>
        </div>
        {list.loading && !list.data ? <PageLoader /> : list.error ? <ErrorBox message={list.error} onRetry={list.reload} /> : list.data.items.length === 0 ? <Empty text="No applications found." /> : (
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr><th className="th">Student</th><th className="th">Branch / CGPA</th><th className="th">Drive</th><th className="th">Applied</th><th className="th">Status</th><th className="th">Update</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.data.items.map((a) => (
                <tr key={a._id}>
                  <td className="td"><p className="font-medium">{a.student?.name}</p><p className="text-xs text-slate-500">{a.student?.email}</p></td>
                  <td className="td">{a.profile?.branch || '—'} · {a.profile?.cgpa ?? '—'}</td>
                  <td className="td">{a.drive?.company?.name}<p className="text-xs text-slate-500">{a.drive?.title}</p></td>
                  <td className="td">{fmtDate(a.createdAt)}</td>
                  <td className="td"><Badge color={statusColor(a.status)}>{a.status}</Badge></td>
                  <td className="td"><select className="input !py-1" value={a.status} onChange={(e) => update(a._id, e.target.value)}>{['applied', 'shortlisted', 'selected', 'rejected'].map((s) => <option key={s}>{s}</option>)}</select></td>
                </tr>
              ))}
            </tbody></table></div>
        )}
      </div>
    </>
  );
}
