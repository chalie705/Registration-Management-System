import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import { ROLES } from '../constants/roles';
import { fmtDate, label, money } from '../utils/format';
import {
  btnGhost, btnGreen, btnPrimary, btnRed, DataTable, ErrorBox, Field, inputCls, Modal, PageHeader, Pagination, StatusBadge,
} from '../components/ui';

function PaymentModal({ onClose, onSaved }) {
  const { data: apps } = useApi(() => api.get('/applications/my', { params: { limit: 100 } }), []);
  const [appId, setAppId] = useState('');
  const [fees, setFees] = useState([]);
  const [feeId, setFeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFeeId('');
    setAmount('');
    if (!appId) return setFees([]);
    api
      .get(`/applications/${appId}`)
      .then((a) => api.get('/fees', { params: { program_id: a.program_id } }))
      .then((list) => setFees(list.filter((f) => f.is_active)))
      .catch((e) => setError(e.message));
  }, [appId]);

  const pickFee = (id) => {
    setFeeId(id);
    const fee = fees.find((f) => String(f.id) === id);
    if (fee) setAmount(String(fee.amount));
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/payments', {
        application_id: Number(appId),
        fee_id: Number(feeId),
        amount: Number(amount),
        method,
        reference,
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
    <Modal title="Record a Payment" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox message={error} />
        <Field label="Application">
          <select required className={inputCls} value={appId} onChange={(e) => setAppId(e.target.value)}>
            <option value="">Select application</option>
            {apps?.data.map((a) => (
              <option key={a.id} value={a.id}>{a.application_no || `#${a.id}`} - {a.program_name}</option>
            ))}
          </select>
        </Field>
        <Field label="Fee">
          <select required className={inputCls} value={feeId} onChange={(e) => pickFee(e.target.value)} disabled={!appId}>
            <option value="">Select fee</option>
            {fees.map((f) => (
              <option key={f.id} value={f.id}>{f.name} ({money(f.amount)})</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Amount ($)">
            <input type="number" required min="1" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Method">
            <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="bank_transfer">Bank transfer</option>
              <option value="mobile_money">Mobile money</option>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
            </select>
          </Field>
        </div>
        <Field label="Payment Reference">
          <input required className={inputCls} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Receipt or transaction number" />
        </Field>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
          <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Saving...' : 'Submit Payment'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function PaymentsPage({ user }) {
  const isApplicant = user.role === ROLES.APPLICANT;
  const canConfirm = [ROLES.FINANCE, ROLES.SUPER_ADMIN].includes(user.role);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => setPage(1), [status]);

  const { data, loading, error, reload } = useApi(async () => {
    if (isApplicant) {
      const rows = await api.get('/payments/my');
      return { data: status ? rows.filter((r) => r.status === status) : rows, meta: null };
    }
    return api.get('/payments', { params: { page, limit: 10, status } });
  }, [page, status, isApplicant]);

  const confirm = async (id, newStatus) => {
    setActionError('');
    try {
      await api.patch(`/payments/${id}/confirm`, { status: newStatus });
      reload();
    } catch (e) {
      setActionError(e.message);
    }
  };

  const columns = [
    { label: 'Receipt', render: (r) => <span className="font-mono text-slate-400">#{r.id}</span> },
    { label: 'Application', key: 'application_no' },
    { label: 'Applicant', render: (r) => <span className="font-semibold text-white">{r.applicant_name}</span> },
    { label: 'Fee', key: 'fee_name' },
    { label: 'Amount', render: (r) => <span className="font-bold text-emerald-400">{money(r.amount)}</span> },
    { label: 'Method', render: (r) => <span className="capitalize">{label(r.method)}</span> },
    { label: 'Reference', render: (r) => <span className="font-mono text-slate-400">{r.reference}</span> },
    { label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    { label: 'Date', render: (r) => fmtDate(r.created_at) },
    ...(canConfirm
      ? [{
          label: 'Verification',
          align: 'right',
          render: (r) =>
            r.status === 'pending' && (
              <span className="space-x-2">
                <button onClick={() => confirm(r.id, 'confirmed')} className={btnGreen}>Verify</button>
                <button onClick={() => confirm(r.id, 'rejected')} className={btnRed}>Reject</button>
              </span>
            ),
        }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee Receipts & Payments"
        subtitle="Track payments, references, and verification status"
        action={
          <div className="flex items-center gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
            </select>
            {isApplicant && (
              <button onClick={() => setShowModal(true)} className={btnPrimary}>
                <Plus className="w-4 h-4" /> Make Payment
              </button>
            )}
          </div>
        }
      />
      <ErrorBox message={error || actionError} />
      <DataTable columns={columns} rows={data?.data} loading={loading} empty="No payments found." />
      <Pagination meta={data?.meta} onPage={setPage} />
      {showModal && <PaymentModal onClose={() => setShowModal(false)} onSaved={reload} />}
    </div>
  );
}