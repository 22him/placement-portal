import { useState } from 'react';
import { Download } from 'lucide-react';
import api, { errMsg } from '../../api';
import { useApp } from '../../AppContext';
import { useLoad, PageLoader, ErrorBox, PageHeader, Badge, Empty, Spinner, statusColor } from '../../components/ui';

export default function AdminReports() {
  const { toast } = useApp();
  const { data, loading, error, reload } = useLoad(async () => (await api.get('/admin/report')).data);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const res = await api.get('/admin/report', { params: { format: 'csv' }, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = 'placement-report.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(false); }
  };

  if (loading) return <PageLoader />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const rows = data.rows;
  const count = (s) => rows.filter((r) => r.status === s).length;

  return (
    <>
      <PageHeader title="Placement reports" subtitle="Application-level report across all drives." actions={<button className="btn-primary" onClick={download} disabled={busy || !rows.length}>{busy ? <Spinner /> : <Download size={16} />} Download CSV</button>} />
      <div className="mb-5 grid gap-5 sm:grid-cols-4">
        {['applied', 'shortlisted', 'selected', 'rejected'].map((s) => <div key={s} className="card text-center"><p className="text-sm capitalize text-slate-500">{s}</p><p className="text-3xl font-bold">{count(s)}</p></div>)}
      </div>
      <div className="card">
        {rows.length === 0 ? <Empty text="No applications recorded yet." /> : (
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr>{['Student', 'Roll no', 'Branch', 'CGPA', 'Company', 'Role', 'LPA', 'Status'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r, i) => <tr key={i}><td className="td">{r.student}</td><td className="td">{r.rollNo}</td><td className="td">{r.branch}</td><td className="td">{r.cgpa}</td><td className="td">{r.company}</td><td className="td">{r.role}</td><td className="td">{r.ctcLPA}</td><td className="td"><Badge color={statusColor(r.status)}>{r.status}</Badge></td></tr>)}
            </tbody></table></div>
        )}
      </div>
    </>
  );
}
