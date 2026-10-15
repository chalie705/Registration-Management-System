import { X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { label as fmtLabel } from '../utils/format';

export const inputCls =
  'w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors';
export const labelCls = 'block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1';

export const btnPrimary =
  'bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all';
export const btnGhost =
  'px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors';
export const btnGreen =
  'px-3 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-semibold border border-emerald-500/30 transition-colors disabled:opacity-60';
export const btnRed =
  'px-3 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-semibold border border-red-500/30 transition-colors disabled:opacity-60';
export const btnBlue =
  'px-3 py-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-xs font-semibold border border-blue-500/30 transition-colors';

export function Field({ label, children }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

export function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`bg-slate-900 border border-slate-800 rounded-2xl w-full ${
          wide ? 'max-w-2xl' : 'max-w-md'
        } max-h-[90vh] overflow-y-auto p-6 shadow-2xl`}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const badgeStyles = {
  approved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  confirmed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  open: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  active: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
  disabled: 'bg-red-500/10 text-red-400 border border-red-500/20',
  submitted: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  under_review: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  draft: 'bg-slate-800 text-slate-300 border border-slate-700',
  closed: 'bg-slate-800 text-slate-400 border border-slate-700',
  inactive: 'bg-slate-800 text-slate-400 border border-slate-700',
};

export function StatusBadge({ status }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
        badgeStyles[status] || 'bg-slate-800 text-slate-300'
      }`}
    >
      {fmtLabel(status)}
    </span>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function Loading({ text = 'Loading...' }) {
  return <div className="py-10 text-center text-slate-500 text-sm">{text}</div>;
}

export function DataTable({ columns, rows, loading, empty = 'No records found.' }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-xs text-slate-400 uppercase tracking-wider">
              {columns.map((c) => (
                <th key={c.label} className={`py-4 px-6 ${c.align === 'right' ? 'text-right' : ''}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {loading && !rows?.length ? (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : !rows?.length ? (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-slate-500">
                  {empty}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                  {columns.map((c) => (
                    <td
                      key={c.label}
                      className={`py-4 px-6 text-slate-300 ${c.align === 'right' ? 'text-right' : ''}`}
                    >
                      {c.render ? c.render(row) : row[c.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Pagination({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-sm text-slate-400">
      <span>
        Page {meta.page} of {meta.totalPages} ({meta.total} records)
      </span>
      <div className="flex gap-2">
        <button
          disabled={meta.page <= 1}
          onClick={() => onPage(meta.page - 1)}
          className={`${btnGhost} disabled:opacity-40 flex items-center gap-1`}
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>
        <button
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPage(meta.page + 1)}
          className={`${btnGhost} disabled:opacity-40 flex items-center gap-1`}
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}