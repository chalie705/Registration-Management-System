export const money = (n) => `$${Number(n || 0).toLocaleString()}`;

export const fmtDate = (d) => (d ? String(d).slice(0, 10) : '—');

export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : '—');

export const label = (s) => (s ? String(s).replace(/_/g, ' ') : '');