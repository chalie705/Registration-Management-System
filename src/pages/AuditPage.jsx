import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../api/client';
import { useApi, useDebounce } from '../hooks/useApi';
import { fmtDateTime } from '../utils/format';
import { DataTable, ErrorBox, PageHeader, Pagination } from '../components/ui';

export default function AuditPage() {
  const [searchInput, setSearchInput] = useState('');
  const action = useDebounce(searchInput);
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [action]);

  const { data, loading, error } = useApi(
    () => api.get('/audit-logs', { params: { page, limit: 15, action } }),
    [page, action]
  );

  const columns = [
    { label: 'Log ID', render: (r) => <span className="font-mono text-slate-400">#{r.id}</span> },
    { label: 'User', render: (r) => <span className="font-semibold text-white">{r.user_name || 'System'}</span> },
    {
      label: 'Action',
      render: (r) => (
        <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-mono">{r.action}</span>
      ),
    },
    { label: 'Entity', render: (r) => `${r.entity}${r.entity_id ? ` #${r.entity_id}` : ''}` },
    {
      label: 'Details',
      render: (r) => (
        <span className="text-xs text-slate-400 font-mono">
          {r.details ? JSON.stringify(r.details).slice(0, 80) : '—'}
        </span>
      ),
    },
    { label: 'IP', render: (r) => <span className="text-xs text-slate-500">{r.ip_address || '—'}</span> },
    { label: 'Timestamp', render: (r) => <span className="text-xs text-slate-400">{fmtDateTime(r.created_at)}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="System Audit Trail" subtitle="Chronological security and administrative action logs" />
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by action, e.g. application"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
        />
      </div>
      <ErrorBox message={error} />
      <DataTable columns={columns} rows={data?.data} loading={loading} empty="No audit logs yet." />
      <Pagination meta={data?.meta} onPage={setPage} />
    </div>
  );
}