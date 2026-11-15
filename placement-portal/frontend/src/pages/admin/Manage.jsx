import { useState } from 'react';
import { Pencil, Trash2, Plus, Users } from 'lucide-react';
import api, { errMsg } from '../../api';
import { useApp } from '../../AppContext';
import { useLoad, PageLoader, ErrorBox, PageHeader, Modal, Field, Spinner, Empty, Badge, fmtDate, statusColor } from '../../components/ui';

const emptyVal = (f) => (f.type === 'number' ? '' : f.default ?? '');

function toForm(fields, item) {
  const out = {};
  fields.forEach((f) => {
    let v = item ? item[f.key] : undefined;
    if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) v = v._id;
    if (f.type === 'list') v = (v || []).join(', ');
    else if (f.type === 'date') v = v ? String(v).slice(0, 10) : '';
    else if (v === undefined || v === null) v = emptyVal(f);
    out[f.key] = v;
  });
  return out;
}

function toPayload(fields, form) {
  const out = {};
  fields.forEach((f) => {
    const v = form[f.key];
    if (f.type === 'list') out[f.key] = String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (f.type === 'number') out[f.key] = v === '' ? undefined : Number(v);
    else out[f.key] = v;
  });
  return out;
}

function CrudPage({ title, subtitle, endpoint, label, columns, fields, searchPlaceholder, rowActions, filters }) {
  const { toast } = useApp();
  const [search, setSearch] = useState('');
  const [flt, setFlt] = useState({});
  const list = useLoad(async () => (await api.get(`/admin/${endpoint}`, { params: { search, ...flt } })).data, [search, JSON.stringify(flt)]);
  const refs = useLoad(async () => {
    const out = {};
    for (const f of fields.filter((x) => x.optionsFrom)) out[f.key] = (await api.get(`/admin/${f.optionsFrom}`)).data.items;
    return out;
  });
  const [editing, setEditing] = useState(null); // {id|null, form}
  const [busy, setBusy] = useState(false);

  const openNew = () => setEditing({ id: null, form: toForm(fields, null) });
  const openEdit = (item) => setEditing({ id: item._id, form: toForm(fields, item) });

  const save = async (e) => {
    e.preventDefault();
    for (const f of fields) {
      const v = editing.form[f.key];
      if (f.required && (v === '' || v === undefined)) return toast(`${f.label} is required`, 'error');
      if (f.type === 'number' && v !== '' && f.min !== undefined && Number(v) < f.min) return toast(`${f.label} must be at least ${f.min}`, 'error');
      if (f.type === 'number' && v !== '' && f.max !== undefined && Number(v) > f.max) return toast(`${f.label} must be at most ${f.max}`, 'error');
    }
    setBusy(true);
    try {
      const body = toPayload(fields, editing.form);
      if (editing.id) await api.put(`/admin/${endpoint}/${editing.id}`, body);
      else await api.post(`/admin/${endpoint}`, body);
      toast(`${label} saved`);
      setEditing(null);
      list.reload();
    } catch (err) { toast(errMsg(err), 'error'); } finally { setBusy(false); }
  };

  const del = async (item) => {
    if (!confirm(`Delete this ${label.toLowerCase()}?`)) return;
    try { await api.delete(`/admin/${endpoint}/${item._id}`); toast(`${label} deleted`); list.reload(); } catch (err) { toast(errMsg(err), 'error'); }
  };

  if (refs.error) return <ErrorBox message={refs.error} onRetry={refs.reload} />;

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} actions={<button className="btn-primary" onClick={openNew}><Plus size={16} /> Add {label.toLowerCase()}</button>} />
      <div className="card">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <input className="input sm:col-span-2" placeholder={searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} />
          {filters?.map((f) => (
            <select key={f.key} className="input" value={flt[f.key] || ''} onChange={(e) => setFlt({ ...flt, [f.key]: e.target.value })}>
              <option value="">{f.label}</option>{f.options.map((o) => <option key={o}>{o}</option>)}
            </select>
          ))}
        </div>
        {list.loading && !list.data ? <PageLoader /> : list.error ? <ErrorBox message={list.error} onRetry={list.reload} /> : list.data.items.length === 0 ? <Empty text={`No ${label.toLowerCase()} records found.`} /> : (
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr>{columns.map((c) => <th key={c.label} className="th">{c.label}</th>)}<th /></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.data.items.map((item) => (
                <tr key={item._id}>
                  {columns.map((c) => <td key={c.label} className="td">{c.render ? c.render(item) : item[c.key] ?? '—'}</td>)}
                  <td className="td whitespace-nowrap text-right">
                    {rowActions?.(item)}
                    <button className="btn-ghost !py-1" onClick={() => openEdit(item)} aria-label="Edit"><Pencil size={14} /></button>{' '}
                    <button className="btn-ghost !py-1 text-red-600" onClick={() => del(item)} aria-label="Delete"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody></table></div>
        )}
      </div>

      {editing && (
        <Modal title={`${editing.id ? 'Edit' : 'Add'} ${label.toLowerCase()}`} onClose={() => setEditing(null)} wide>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => {
              const v = editing.form[f.key];
              const set = (val) => setEditing({ ...editing, form: { ...editing.form, [f.key]: val } });
              const common = { className: 'input', value: v, onChange: (e) => set(e.target.value) };
              let control;
              if (f.type === 'textarea') control = <textarea {...common} className="input min-h-24" />;
              else if (f.type === 'select') {
                const opts = f.optionsFrom ? (refs.data?.[f.key] || []).map((o) => [o._id, o.name]) : f.options.map((o) => [o, o]);
                control = <select {...common}><option value="">Select…</option>{opts.map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}</select>;
              } else control = <input {...common} type={f.type === 'list' ? 'text' : f.type || 'text'} step={f.type === 'number' ? 'any' : undefined} min={f.min} max={f.max} placeholder={f.type === 'list' ? 'comma separated' : undefined} />;
              return <div key={f.key} className={f.full || f.type === 'textarea' ? 'sm:col-span-2' : ''}><Field label={`${f.label}${f.required ? ' *' : ''}`}>{control}</Field></div>;
            })}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" disabled={busy}>{busy && <Spinner />} Save</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

const branchHint = 'CSE, IT, ECE (empty = all)';

export const CompaniesAdmin = () => (
  <CrudPage title="Companies" subtitle="Maintain company profiles and default eligibility." endpoint="companies" label="Company" searchPlaceholder="Search by name, industry or location"
    columns={[{ label: 'Company', render: (c) => <span className="font-medium">{c.name}</span> }, { label: 'Industry', key: 'industry' }, { label: 'Location', key: 'location' }, { label: 'LPA', key: 'packageLPA' }, { label: 'Min CGPA', key: 'minCgpa' }, { label: 'Skills', render: (c) => <div className="flex max-w-xs flex-wrap gap-1">{c.requiredSkills?.slice(0, 4).map((s) => <Badge key={s} color="violet">{s}</Badge>)}</div> }]}
    fields={[
      { key: 'name', label: 'Company name', required: true },
      { key: 'industry', label: 'Industry' },
      { key: 'location', label: 'Location' },
      { key: 'website', label: 'Website' },
      { key: 'packageLPA', label: 'Package (LPA)', type: 'number', min: 0 },
      { key: 'minCgpa', label: 'Minimum CGPA', type: 'number', min: 0, max: 10 },
      { key: 'maxBacklogs', label: 'Max backlogs', type: 'number', min: 0 },
      { key: 'allowedBranches', label: `Allowed branches (${branchHint})`, type: 'list' },
      { key: 'roles', label: 'Roles offered', type: 'list', full: true },
      { key: 'requiredSkills', label: 'Required skills', type: 'list', full: true },
      { key: 'description', label: 'Description', type: 'textarea' },
    ]} />
);

export const DrivesAdmin = () => {
  const [view, setView] = useState(null);
  return (
    <>
      <CrudPage title="Placement drives" subtitle="Create drives, set eligibility and see who qualifies." endpoint="drives" label="Drive" searchPlaceholder="Search drives" filters={[{ key: 'status', label: 'All statuses', options: ['upcoming', 'closed', 'completed'] }]}
        columns={[{ label: 'Drive', render: (d) => <div><p className="font-medium">{d.title}</p><p className="text-xs text-slate-500">{d.company?.name} · {d.role}</p></div> }, { label: 'Drive date', render: (d) => fmtDate(d.driveDate) }, { label: 'Deadline', render: (d) => fmtDate(d.deadline) }, { label: 'LPA', key: 'ctcLPA' }, { label: 'Status', render: (d) => <Badge color={statusColor(d.status)}>{d.status}</Badge> }]}
        rowActions={(d) => <button className="btn-ghost !py-1 mr-1" onClick={() => setView(d)}><Users size={14} /> Eligible</button>}
        fields={[
          { key: 'company', label: 'Company', type: 'select', optionsFrom: 'companies', required: true },
          { key: 'title', label: 'Drive title', required: true },
          { key: 'role', label: 'Role', required: true },
          { key: 'ctcLPA', label: 'CTC (LPA)', type: 'number', min: 0 },
          { key: 'driveDate', label: 'Drive date', type: 'date', required: true },
          { key: 'deadline', label: 'Application deadline', type: 'date', required: true },
          { key: 'minCgpa', label: 'Minimum CGPA', type: 'number', min: 0, max: 10 },
          { key: 'maxBacklogs', label: 'Max backlogs', type: 'number', min: 0 },
          { key: 'allowedBranches', label: `Allowed branches (${branchHint})`, type: 'list', full: true },
          { key: 'requiredSkills', label: 'Required skills', type: 'list', full: true },
          { key: 'status', label: 'Status', type: 'select', options: ['upcoming', 'closed', 'completed'], default: 'upcoming' },
          { key: 'jobDescription', label: 'Job description', type: 'textarea' },
        ]} />
      {view && <EligibleModal drive={view} onClose={() => setView(null)} />}
    </>
  );
};

function EligibleModal({ drive, onClose }) {
  const { data, loading, error, reload } = useLoad(async () => (await api.get(`/admin/drives/${drive._id}/eligible`)).data);
  return (
    <Modal title={`Eligible students · ${drive.title}`} onClose={onClose} wide>
      {loading ? <PageLoader /> : error ? <ErrorBox message={error} onRetry={reload} /> : data.items.length === 0 ? <Empty text="No eligible students." /> : (
        <div className="max-h-96 overflow-auto"><table className="w-full">
          <thead><tr><th className="th">Student</th><th className="th">Branch</th><th className="th">CGPA</th><th className="th">Match</th><th className="th">Applied</th></tr></thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.items.map((r) => <tr key={r.student._id}><td className="td">{r.student.name}<p className="text-xs text-slate-500">{r.student.email}</p></td><td className="td">{r.profile.branch}</td><td className="td">{r.profile.cgpa}</td><td className="td font-semibold">{r.matchPercent}%</td><td className="td">{r.applied ? <Badge color="green">Yes</Badge> : <Badge>No</Badge>}</td></tr>)}
          </tbody></table></div>
      )}
    </Modal>
  );
}

export const CodingAdmin = () => (
  <CrudPage title="Coding questions" subtitle="Manage the DSA question bank students practise from." endpoint="coding" label="Question" searchPlaceholder="Search by title or topic" filters={[{ key: 'difficulty', label: 'All difficulties', options: ['Easy', 'Medium', 'Hard'] }]}
    columns={[{ label: 'Title', render: (q) => <span className="font-medium">{q.title}</span> }, { label: 'Topic', key: 'topic' }, { label: 'Difficulty', render: (q) => <Badge color={statusColor(q.difficulty)}>{q.difficulty}</Badge> }]}
    fields={[
      { key: 'title', label: 'Title', required: true },
      { key: 'topic', label: 'Topic', required: true },
      { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['Easy', 'Medium', 'Hard'], required: true },
      { key: 'link', label: 'Practice link (URL)' },
      { key: 'hints', label: 'Hints', type: 'list', full: true },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
    ]} />
);
