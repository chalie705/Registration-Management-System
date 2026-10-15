import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import { ROLES } from '../constants/roles';
import { fmtDate, money } from '../utils/format';
import { btnGhost, btnPrimary, DataTable, ErrorBox, Field, inputCls, Modal, PageHeader, StatusBadge } from '../components/ui';

function FeeModal({ onClose, onSaved }) {
  const { data: programs } = useApi(() => api.get('/programs', { params: { active: 'true' } }), []);
  const [form, setForm] = useState({ name: '', program_id: '', amount: '1000', due_date: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/fees', {
        name: form.name,
        amount: Number(form.amount),
        program_id: form.program_id ? Number(form.program_id) : null,
        due_date: form.due_date || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Add Fee Structure" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox message={error} />
        <Field label="Fee Name">
          <input required className={inputCls} value={form.name} onChange={set('name')} placeholder="e.g. Tuition Fee Semester 1" />
        </Field>
        <Field label="Program">
          <select className={inputCls} value={form.program_id} onChange={set('program_id')}>
            <option value="">All Programs</option>
            {programs?.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Amount ($)">
            <input type="number" required min="0" className={inputCls} value={form.amount} onChange={set('amount')} />
          </Field>
          <Field label="Due Date">
            <input type="date" className={inputCls} value={form.due_date} onChange={set('due_date')} />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
          <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Saving...' : 'Save Fee'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function FeesPage({ user }) {
  const canManage = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE].includes(user.role);
  const { data, loading, error, reload } = useApi(() => api.get('/fees'), []);
  const [showModal, setShowModal] = useState(false);

  const columns = [
    { label: 'Fee Item', render: (r) => <span className="font-semibold text-white">{r.name}</span> },
    { label: 'Program', render: (r) => r.program_name || 'All Programs' },
    { label: 'Amount', render: (r) => <span className="font-bold text-emerald-400">{money(r.amount)}</span> },
    { label: 'Due Date', render: (r) => fmtDate(r.due_date) },
    { label: 'Status', render: (r) => <StatusBadge status={r.is_active ? 'active' : 'inactive'} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee Structures & Schedules"
        subtitle="Tuition, lab fees, and payment deadlines"
        action={
          canManage && (
            <button onClick={() => setShowModal(true)} className={btnPrimary}>
              <Plus className="w-4 h-4" /> Add Fee Structure
            </button>
          )
        }
      />
      <ErrorBox message={error} />
      <DataTable columns={columns} rows={data} loading={loading} empty="No fees defined yet." />
      {showModal && <FeeModal onClose={() => setShowModal(false)} onSaved={reload} />}
    </div>
  );
}