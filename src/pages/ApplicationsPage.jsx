import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { api } from '../api/client';
import { useApi, useDebounce } from '../hooks/useApi';
import { ROLES } from '../constants/roles';
import { fmtDate } from '../utils/format';
import {
  btnBlue, btnGhost, btnPrimary, DataTable, ErrorBox, Field, inputCls, Modal, Pagination, StatusBadge,
} from '../components/ui';
import ApplicationDetail from './ApplicationDetail';

function NewApplicationModal({ onClose, onChanged }) {
  const { data: programs } = useApi(() => api.get('/programs', { params: { active: 'true' } }), []);
  const { data: periods } = useApi(() => api.get('/periods'), []);
  const [programId, setProgramId] = useState('');
  const [periodId, setPeriodId] = useState('');
  const [statement, setStatement] = useState('');
  const [docType, setDocType] = useState('transcript');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (programs?.length && !programId) setProgramId(String(programs[0].id));
  }, [programs, programId]);
  useEffect(() => {
    if (periods?.length && !periodId) setPeriodId(String(periods[0].id));
  }, [periods, periodId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please choose a document to upload');
    setBusy(true);
    setError('');
    let appId = null;
    try {
      const app = await api.post('/applications', {
        program_id: Number(programId),
        period_id: Number(periodId),
        statement,
      });
      appId = app.id;
      const fd = new FormData();
      fd.append('doc_type', docType);
      fd.append('file', file);
      await api.upload(`/applications/${appId}/documents`, fd);
      await api.post(`/applications/${appId}/submit`);
      onChanged();
      onClose();
    } catch (err) {
      if (appId) {
        onChanged();
        setError(`${err.message}. Your draft was saved. Close this window and open it from the list to finish.`);
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Submit New Application" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox message={error} />
        <Field label="Select Program">
          <select className={inputCls} value={programId} onChange={(e) => setProgramId(e.target.value)} required>
            {programs?.map((p) => (
              <option key={p.id} value={p.id}>{p.name} (${p.tuition_fee})</option>
            ))}
          </select>
        </Field>
        <Field label="Registration Period">
          <select className={inputCls} value={periodId} onChange={(e) => setPeriodId(e.target.value)} required>
            {periods?.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {periods && periods.length === 0 && (
            <p className="text-xs text-amber-400 mt-1">No registration period is open right now.</p>
          )}
        </Field>
        <Field label="Personal Statement">
          <textarea rows={3} className={inputCls} value={statement} onChange={(e) => setStatement(e.target.value)} placeholder="Why do you want to join this program?" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Document Type">
            <select className={inputCls} value={docType} onChange={(e) => setDocType(e.target.value)}>
              <option value="transcript">Transcript</option>
              <option value="national_id">National ID</option>
              <option value="certificate">Certificate</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="File (PDF/JPG/PNG, 5MB)">
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files[0])} className="w-full text-xs text-slate-300 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-slate-200" />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
          <button type="submit" disabled={busy || !programId || !periodId} className={btnPrimary}>
            {busy ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ApplicationsPage({ user }) {
  const isApplicant = user.role === ROLES.APPLICANT;
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showNew, setShowNew] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => setPage(1), [search, status]);

  const { data, loading, error, reload } = useApi(
    () => api.get(isApplicant ? '/applications/my' : '/applications', { params: { page, limit: 10, search, status } }),
    [page, search, status, isApplicant]
  );

  const columns = [
    { label: 'Application No', render: (r) => <span className="font-mono text-slate-400">{r.application_no || `#${r.id}`}</span> },
    { label: 'Applicant', render: (r) => <span className="font-semibold text-white">{r.applicant_name}</span> },
    { label: 'Program', key: 'program_name' },
    { label: 'Period', key: 'period_name' },
    { label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { label: 'Date', render: (r) => fmtDate(r.submitted_at || r.created_at) },
    { label: 'Actions', align: 'right', render: (r) => <button className={btnBlue} onClick={() => setSelectedId(r.id)}>View</button> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by application no or applicant..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            {isApplicant && <option value="draft">Draft</option>}
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {isApplicant && (
          <button onClick={() => setShowNew(true)} className={btnPrimary}>
            <Plus className="w-4 h-4" /> New Application
          </button>
        )}
      </div>

      <ErrorBox message={error} />
      <DataTable columns={columns} rows={data?.data} loading={loading} empty="No applications found." />
      <Pagination meta={data?.meta} onPage={setPage} />

      {showNew && <NewApplicationModal onClose={() => setShowNew(false)} onChanged={reload} />}
      {selectedId && (
        <ApplicationDetail id={selectedId} user={user} onClose={() => setSelectedId(null)} onChanged={reload} />
      )}
    </div>
  );
}