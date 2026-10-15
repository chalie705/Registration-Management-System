import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { api } from '../api/client';
import { useApi, useDebounce } from '../hooks/useApi';
import { fmtDateTime } from '../utils/format';
import {
  btnGhost, btnGreen, btnPrimary, btnRed, DataTable, ErrorBox, Field, inputCls, Modal, PageHeader, Pagination, StatusBadge,
} from '../components/ui';

function UserModal({ onClose, onSaved }) {
  const { data: roles } = useApi(() => api.get('/users/roles'), []);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', role_id: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/users', {
        ...form,
        phone: form.phone || undefined,
        role_id: Number(form.role_id),
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
    <Modal title="Create User" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox message={error} />
        <Field label="Full Name">
          <input required className={inputCls} value={form.full_name} onChange={set('full_name')} />
        </Field>
        <Field label="Email">
          <input type="email" required className={inputCls} value={form.email} onChange={set('email')} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone (optional)">
            <input className={inputCls} value={form.phone} onChange={set('phone')} />
          </Field>
          <Field label="Role">
            <select required className={inputCls} value={form.role_id} onChange={set('role_id')}>
              <option value="">Select role</option>
              {roles?.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Temporary Password (min 8)">
          <input type="password" required minLength={8} className={inputCls} value={form.password} onChange={set('password')} />
        </Field>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
          <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Creating...' : 'Create User'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function UsersPage({ user }) {
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => setPage(1), [search]);

  const { data, loading, error, reload } = useApi(
    () => api.get('/users', { params: { page, limit: 10, search } }),
    [page, search]
  );

  const toggle = async (u) => {
    setActionError('');
    try {
      await api.patch(`/users/${u.id}/status`, { is_active: !u.is_active });
      reload();
    } catch (e) {
      setActionError(e.message);
    }
  };

  const columns = [
    { label: 'User ID', render: (r) => <span className="font-mono text-slate-400">#{r.id}</span> },
    { label: 'Full Name', render: (r) => <span className="font-semibold text-white">{r.full_name}</span> },
    { label: 'Email', key: 'email' },
    {
      label: 'Role',
      render: (r) => (
        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold">{r.role}</span>
      ),
    },
    { label: 'Status', render: (r) => <StatusBadge status={r.is_active ? 'active' : 'disabled'} /> },
    { label: 'Last Login', render: (r) => <span className="text-xs text-slate-400">{fmtDateTime(r.last_login_at)}</span> },
    {
      label: 'Actions',
      align: 'right',
      render: (r) =>
        r.id !== user.id && (
          <button onClick={() => toggle(r)} className={r.is_active ? btnRed : btnGreen}>
            {r.is_active ? 'Disable' : 'Enable'}
          </button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="System User Directory"
        subtitle="Manage user accounts and access control roles"
        action={
          <button onClick={() => setShowModal(true)} className={btnPrimary}>
            <Plus className="w-4 h-4" /> Create User
          </button>
        }
      />
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
        />
      </div>
      <ErrorBox message={error || actionError} />
      <DataTable columns={columns} rows={data?.data} loading={loading} empty="No users found." />
      <Pagination meta={data?.meta} onPage={setPage} />
      {showModal && <UserModal onClose={() => setShowModal(false)} onSaved={reload} />}
    </div>
  );
}