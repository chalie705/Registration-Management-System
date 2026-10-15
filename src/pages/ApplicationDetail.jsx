import { useState } from 'react';
import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import { ROLES } from '../constants/roles';
import { fmtDateTime, label, money } from '../utils/format';
import {
  btnGhost, btnGreen, btnPrimary, btnRed, ErrorBox, Field, inputCls, Loading, Modal, StatusBadge,
} from '../components/ui';

const Section = ({ title, children }) => (
  <div className="mt-5">
    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{title}</h4>
    {children}
  </div>
);

export default function ApplicationDetail({ id, user, onClose, onChanged }) {
  const { data: app, loading, error, reload } = useApi(() => api.get(`/applications/${id}`), [id]);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [docType, setDocType] = useState('other');
  const [review, setReview] = useState({ decision: 'recommend_approve', score: '', comments: '' });
  const [remarks, setRemarks] = useState('');

  const isApplicant = user.role === ROLES.APPLICANT;
  const isReviewer = user.role === ROLES.REVIEWER;
  const isRegistrar = [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user.role);

  const run = async (fn) => {
    setBusy(true);
    setActionError('');
    try {
      await fn();
      await reload();
      onChanged();
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const upload = () =>
    run(async () => {
      const fd = new FormData();
      fd.append('doc_type', docType);
      fd.append('file', file);
      await api.upload(`/applications/${id}/documents`, fd);
      setFile(null);
      setFileKey((k) => k + 1);
    });

  const submitApp = () => run(() => api.post(`/applications/${id}/submit`));

  const sendReview = () =>
    run(async () => {
      await api.post(`/applications/${id}/review`, {
        decision: review.decision,
        score: review.score === '' ? undefined : Number(review.score),
        comments: review.comments,
      });
      setReview({ decision: 'recommend_approve', score: '', comments: '' });
    });

  const decide = (decision) => run(() => api.post(`/applications/${id}/decision`, { decision, remarks }));

  return (
    <Modal title={app ? `Application ${app.application_no || `#${app.id}`}` : 'Application'} onClose={onClose} wide>
      {loading && !app && <Loading />}
      <ErrorBox message={error} />

      {app && (
        <>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Applicant</span>
              <span className="text-white font-semibold">{app.applicant_name}</span>
              <span className="text-slate-400 block text-xs">{app.applicant_email}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Status</span>
              <StatusBadge status={app.status} />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Program</span>
              <span className="text-slate-200">{app.program_name}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Period</span>
              <span className="text-slate-200">{app.period_name}</span>
            </div>
          </div>

          {app.statement && (
            <Section title="Personal Statement">
              <p className="text-sm text-slate-300 bg-slate-950 border border-slate-800 rounded-xl p-3 whitespace-pre-wrap">{app.statement}</p>
            </Section>
          )}

          {app.decision_remarks && (
            <Section title="Decision Remarks">
              <p className="text-sm text-slate-300">{app.decision_remarks}</p>
            </Section>
          )}

          <Section title={`Documents (${app.documents.length})`}>
            {app.documents.length === 0 ? (
              <p className="text-sm text-slate-500">No documents uploaded.</p>
            ) : (
              <ul className="space-y-2">
                {app.documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm">
                    <span className="text-slate-200 truncate">{d.file_name}</span>
                    <span className="text-xs text-slate-500 shrink-0 ml-3">
                      {label(d.doc_type)} • {Math.round((d.size_bytes || 0) / 1024)} KB
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Status History">
            <ol className="space-y-2 border-l border-slate-800 pl-4">
              {app.history.map((h) => (
                <li key={h.id} className="text-sm">
                  <span className="text-slate-200 capitalize">{label(h.to_status)}</span>
                  <span className="text-xs text-slate-500 ml-2">{fmtDateTime(h.created_at)}</span>
                  {h.remarks && <p className="text-xs text-slate-400">{h.remarks}</p>}
                </li>
              ))}
            </ol>
          </Section>

          {!isApplicant && app.reviews?.length > 0 && (
            <Section title="Reviews">
              <div className="space-y-2">
                {app.reviews.map((r) => (
                  <div key={r.id} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-200 font-semibold">{r.reviewer_name}</span>
                      <span className="text-xs text-blue-400 capitalize">{label(r.decision)}{r.score != null ? ` • ${r.score}/100` : ''}</span>
                    </div>
                    {r.comments && <p className="text-xs text-slate-400 mt-1">{r.comments}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {!isApplicant && app.payments?.length > 0 && (
            <Section title="Payments">
              <div className="space-y-2">
                {app.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm">
                    <span className="text-slate-200">{money(p.amount)} <span className="text-xs text-slate-500">({p.reference})</span></span>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            </Section>
          )}

          <ErrorBox message={actionError} />

          {isApplicant && app.status === 'draft' && (
            <Section title="Complete Your Application">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select className={inputCls} value={docType} onChange={(e) => setDocType(e.target.value)}>
                  <option value="transcript">Transcript</option>
                  <option value="national_id">National ID</option>
                  <option value="certificate">Certificate</option>
                  <option value="other">Other</option>
                </select>
                <input key={fileKey} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files[0])} className="w-full text-xs text-slate-300 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-slate-200" />
              </div>
              <div className="flex gap-3 mt-3">
                <button disabled={busy || !file} onClick={upload} className={btnGhost}>Upload Document</button>
                <button disabled={busy || app.documents.length === 0} onClick={submitApp} className={btnPrimary}>Submit Application</button>
              </div>
            </Section>
          )}

          {isReviewer && ['submitted', 'under_review'].includes(app.status) && (
            <Section title="Add Review">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Recommendation">
                    <select className={inputCls} value={review.decision} onChange={(e) => setReview({ ...review, decision: e.target.value })}>
                      <option value="recommend_approve">Recommend approve</option>
                      <option value="recommend_reject">Recommend reject</option>
                      <option value="needs_info">Needs more info</option>
                    </select>
                  </Field>
                  <Field label="Score (0-100)">
                    <input type="number" min="0" max="100" className={inputCls} value={review.score} onChange={(e) => setReview({ ...review, score: e.target.value })} />
                  </Field>
                </div>
                <Field label="Comments">
                  <textarea rows={2} className={inputCls} value={review.comments} onChange={(e) => setReview({ ...review, comments: e.target.value })} />
                </Field>
                <button disabled={busy} onClick={sendReview} className={btnPrimary}>Submit Review</button>
              </div>
            </Section>
          )}

          {isRegistrar && app.status === 'under_review' && (
            <Section title="Final Decision">
              <Field label="Remarks (required when rejecting)">
                <textarea rows={2} className={inputCls} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              </Field>
              <div className="flex gap-3 mt-3">
                <button disabled={busy} onClick={() => decide('approved')} className={btnGreen}>Approve</button>
                <button disabled={busy} onClick={() => decide('rejected')} className={btnRed}>Reject</button>
              </div>
            </Section>
          )}
        </>
      )}
    </Modal>
  );
}