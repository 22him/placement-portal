import { useState } from 'react';
import { MapPin, IndianRupee, CalendarDays } from 'lucide-react';
import api, { errMsg } from '../../api';
import { useApp } from '../../AppContext';
import { useLoad, PageLoader, ErrorBox, PageHeader, Badge, Empty, Modal, Spinner, Notice, fmtDate, statusColor } from '../../components/ui';

export default function Drives() {
  const { toast } = useApp();
  const [f, setF] = useState({ search: '', status: '' });
  const drives = useLoad(async () => (await api.get('/student/drives', { params: f })).data, [f.search, f.status]);
  const apps = useLoad(async () => (await api.get('/student/applications')).data);
  const [sel, setSel] = useState(null);
  const [tab, setTab] = useState('drives');
  const [busy, setBusy] = useState(false);

  const act = async (fn, msg) => {
    setBusy(true);
    try { await fn(); toast(msg); setSel(null); drives.reload(); apps.reload(); } catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Placement drives" subtitle="Check eligibility, apply and track your applications." />
      <div className="mb-4 inline-flex rounded-lg bg-slate-100 p-1 text-sm dark:bg-slate-800">
        {[['drives', 'All drives'], ['apps', 'My applications']].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`rounded-md px-4 py-1.5 font-medium ${tab === k ? 'bg-white shadow dark:bg-slate-700' : 'text-slate-500'}`}>{l}</button>)}
      </div>

      {tab === 'drives' ? (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <input className="input sm:col-span-2" placeholder="Search by company, role or title" value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} />
            <select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">All statuses</option><option value="upcoming">Upcoming</option><option value="closed">Closed</option><option value="completed">Completed</option></select>
          </div>
          {drives.loading && !drives.data ? <PageLoader /> : drives.error ? <ErrorBox message={drives.error} onRetry={drives.reload} /> : drives.data.items.length === 0 ? <Empty text="No drives found." /> : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {drives.data.items.map((d) => (
                <div key={d._id} className="card flex flex-col transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="mb-2 flex items-center justify-between"><Badge color={statusColor(d.status)}>{d.status}</Badge>{d.applicationStatus ? <Badge color={statusColor(d.applicationStatus)}>{d.applicationStatus}</Badge> : d.eligible ? <Badge color="green">Eligible</Badge> : <Badge color="red">Not eligible</Badge>}</div>
                  <h3 className="font-semibold">{d.company?.name}</h3>
                  <p className="text-sm text-slate-500">{d.role}</p>
                  <div className="mt-3 space-y-1 text-xs text-slate-500">
                    <p className="flex items-center gap-1"><IndianRupee size={12} /> {d.ctcLPA ? `${d.ctcLPA} LPA` : 'Not disclosed'}</p>
                    <p className="flex items-center gap-1"><MapPin size={12} /> {d.company?.location || '—'}</p>
                    <p className="flex items-center gap-1"><CalendarDays size={12} /> Apply by {fmtDate(d.deadline)}</p>
                  </div>
                  <button className="btn-ghost mt-4" onClick={() => setSel(d)}>View details</button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : apps.loading ? <PageLoader /> : apps.error ? <ErrorBox message={apps.error} onRetry={apps.reload} /> : apps.data.items.length === 0 ? <Empty text="You have not applied to any drive yet." /> : (
        <div className="card overflow-x-auto"><table className="w-full">
          <thead><tr><th className="th">Company</th><th className="th">Role</th><th className="th">Drive date</th><th className="th">Status</th><th className="th">Remarks</th></tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {apps.data.items.map((a) => <tr key={a._id}><td className="td font-medium">{a.drive?.company?.name}</td><td className="td">{a.drive?.role}</td><td className="td">{fmtDate(a.drive?.driveDate)}</td><td className="td"><Badge color={statusColor(a.status)}>{a.status}</Badge></td><td className="td text-slate-500">{a.remarks || '—'}</td></tr>)}
          </tbody></table></div>
      )}

      {sel && (
        <Modal title={`${sel.company?.name} · ${sel.role}`} onClose={() => setSel(null)} wide>
          <div className="space-y-4 text-sm">
            {sel.company?.description && <p className="text-slate-500">{sel.company.description}</p>}
            <div><p className="label">Job description</p><p>{sel.jobDescription || '—'}</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><p className="label">Eligibility</p><ul className="list-disc pl-5"><li>Minimum CGPA: {sel.minCgpa}</li><li>Max backlogs: {sel.maxBacklogs}</li><li>Branches: {sel.allowedBranches?.join(', ') || 'All'}</li></ul></div>
              <div><p className="label">Required skills</p><div className="flex flex-wrap gap-1">{sel.requiredSkills?.map((s) => <Badge key={s} color="violet">{s}</Badge>)}</div></div>
              <div><p className="label">Package</p>{sel.ctcLPA ? `${sel.ctcLPA} LPA` : '—'}</div>
              <div><p className="label">Dates</p>Deadline {fmtDate(sel.deadline)} · Drive {fmtDate(sel.driveDate)}</div>
            </div>
            {!sel.eligible && <Notice>You are not eligible: {sel.missingEligibility.join('; ')}</Notice>}
            <div className="flex justify-end gap-2">
              {sel.applicationStatus === 'applied' && <button className="btn-ghost text-red-600" disabled={busy} onClick={() => act(() => api.delete(`/student/drives/${sel._id}/apply`), 'Application withdrawn')}>Withdraw application</button>}
              {!sel.applicationStatus && <button className="btn-primary" disabled={busy || !sel.eligible || sel.status !== 'upcoming'} onClick={() => act(() => api.post(`/student/drives/${sel._id}/apply`), 'Applied successfully')}>{busy && <Spinner />} Apply now</button>}
              {sel.applicationStatus && sel.applicationStatus !== 'applied' && <Badge color={statusColor(sel.applicationStatus)}>{sel.applicationStatus}</Badge>}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
