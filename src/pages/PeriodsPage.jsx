import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import { ROLES } from '../constants/roles';
import { fmtDate } from '../utils/format';
import {
  btnGhost, btnGreen, btnPrimary, btnRed, DataTable, ErrorBox, Field, inputCls, Modal, PageHeader, StatusBadge,
} from '../components/ui';

function PeriodModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', academic_year: '', start_date: '', end_date: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/periods', { ...form, is_open: true });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Add Registration Period" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox message={error} />
        <Field label="Period Name">
          <input required className={inputCls} value={form.name} onChange={set('name')} placeholder="e.g. Fall Admissions" />
        </Field>
        <Field label="Academic Year">
          <input required className={inputCls} value={form.academic_year} onChange={set('academic_year')} placeholder="2026/2027" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Date">
            <input type="date" required className={inputCls} value={form.start_date} onChange={set('start_date')} />
          </Field>
          <Field label="End Date">
            <input type="date" required className={inputCls} value={form.end_date} onChange={set('end_date')} />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
          <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Saving...' : 'Create Period'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function PeriodsPage({ user }) {
  const canManage = [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user.role);
  const { data, loading, error, reload } = useApi(() => api.get('/periods'), []);
  const [showModal, setShowModal] = useState(false);
  const [actionError, setActionError] = useState('');

  const toggle = async (p) => {
    setActionError('');
    try {
      await api.put(`/periods/${p.id}`, { is_open: !p.is_open });
      reload();
    } catch (e) {
      setActionError(e.message);
    }
  };

  const columns = [
    { label: 'Period Name', render: (r) => <span className="font-semibold text-white">{r.name}</span> },
    { label: 'Academic Year', key: 'academic_year' },
    { label: 'Start Date', render: (r) => fmtDate(r.start_date) },
    { label: 'End Date', render: (r) => fmtDate(r.end_date) },
    { label: 'Status', render: (r) => <StatusBadge status={r.is_open ? 'open' : 'closed'} /> },
    ...(canManage
      ? [{
          label: 'Toggle Window',
          align: 'right',
          render: (r) => (
            <button onClick={() => toggle(r)} className={r.is_open ? btnRed : btnGreen}>
              {r.is_open ? 'Close Period' : 'Open Period'}
            </button>
          ),
        }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registration Periods & Terms"
        subtitle="Manage active admission and registration windows"
        action={
          canManage && (
            <button onClick={() => setShowModal(true)} className={btnPrimary}>
              <Plus className="w-4 h-4" /> Add Period
            </button>
          )
        }
      />
      <ErrorBox message={error || actionError} />
      <DataTable columns={columns} rows={data} loading={loading} empty="No registration periods yet." />
      {showModal && <PeriodModal onClose={() => setShowModal(false)} onSaved={reload} />}
    </div>
  );
}