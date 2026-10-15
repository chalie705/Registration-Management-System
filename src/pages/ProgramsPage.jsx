import { useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import { ROLES } from '../constants/roles';
import { money } from '../utils/format';
import { btnGhost, btnPrimary, btnRed, ErrorBox, Field, inputCls, Loading, Modal, PageHeader, StatusBadge } from '../components/ui';

function ProgramModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ code: '', name: '', description: '', tuition_fee: '40000', capacity: '100' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/programs', {
        ...form,
        tuition_fee: Number(form.tuition_fee),
        capacity: Number(form.capacity),
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
    <Modal title="Add Academic Program" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox message={error} />
        <div className="grid grid-cols-3 gap-4">
          <Field label="Code">
            <input required className={inputCls} value={form.code} onChange={set('code')} placeholder="BSC-DS" />
          </Field>
          <div className="col-span-2">
            <Field label="Program Name">
              <input required className={inputCls} value={form.name} onChange={set('name')} placeholder="B.Sc. Data Science" />
            </Field>
          </div>
        </div>
        <Field label="Description">
          <input className={inputCls} value={form.description} onChange={set('description')} placeholder="School of Computing" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Capacity">
            <input type="number" required className={inputCls} value={form.capacity} onChange={set('capacity')} />
          </Field>
          <Field label="Tuition Fee ($)">
            <input type="number" required className={inputCls} value={form.tuition_fee} onChange={set('tuition_fee')} />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
          <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Saving...' : 'Save Program'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProgramsPage({ user }) {
  const canManage = [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user.role);
  const { data, loading, error, reload } = useApi(() => api.get('/programs'), []);
  const [showModal, setShowModal] = useState(false);
  const [actionError, setActionError] = useState('');

  const deactivate = async (p) => {
    if (!window.confirm(`Deactivate "${p.name}"?`)) return;
    setActionError('');
    try {
      await api.del(`/programs/${p.id}`);
      reload();
    } catch (e) {
      setActionError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Programs"
        subtitle="Browse available degrees and tuition schedules"
        action={
          canManage && (
            <button onClick={() => setShowModal(true)} className={btnPrimary}>
              <Plus className="w-4 h-4" /> Add Program
            </button>
          )
        }
      />
      <ErrorBox message={error || actionError} />
      {loading && !data && <Loading />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data?.map((p) => (
          <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">{p.code}</span>
                {!p.is_active && <StatusBadge status="inactive" />}
              </div>
              <h3 className="text-lg font-bold text-white mt-3">{p.name}</h3>
              {p.description && <p className="text-sm text-slate-400 mt-1">{p.description}</p>}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Capacity</span>
                <span className="font-semibold text-slate-200">{p.capacity} Students</span>
              </div>
              {canManage && p.is_active && (
                <button onClick={() => deactivate(p)} className={btnRed}>Deactivate</button>
              )}
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Tuition Fee</span>
                <span className="font-bold text-emerald-400">{money(p.tuition_fee)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && <ProgramModal onClose={() => setShowModal(false)} onSaved={reload} />}
    </div>
  );
}