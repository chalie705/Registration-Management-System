import { FileText, Calendar, CheckCircle2, DollarSign } from 'lucide-react';
import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import { ROLES } from '../constants/roles';
import { money, fmtDate } from '../utils/format';
import { ErrorBox, Loading, StatusBadge } from '../components/ui';

function StatCard({ title, value, color, Icon }) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase font-semibold">{title}</p>
          <h3 className={`text-2xl font-bold mt-1 ${color}`}>{value}</h3>
        </div>
        <div className="w-12 h-12 bg-slate-800/60 rounded-xl flex items-center justify-center border border-slate-700">
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}

export default function OverviewPage({ user }) {
  const isApplicant = user.role === ROLES.APPLICANT;
  const canSeePayments = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE, ROLES.AUDITOR].includes(user.role);

  const { data, loading, error } = useApi(async () => {
    const [programs, periods] = await Promise.all([api.get('/programs'), api.get('/periods')]);
    let totalApps = 0;
    let approvedApps = 0;
    let collected = null;

    if (isApplicant) {
      const apps = await api.get('/applications/my', { params: { limit: 100 } });
      totalApps = apps.meta.total;
      approvedApps = apps.data.filter((a) => a.status === 'approved').length;
      const pays = await api.get('/payments/my');
      collected = pays.filter((p) => p.status === 'confirmed').reduce((s, p) => s + Number(p.amount), 0);
    } else {
      const [all, ok] = await Promise.all([
        api.get('/applications', { params: { limit: 1 } }),
        api.get('/applications', { params: { status: 'approved', limit: 1 } }),
      ]);
      totalApps = all.meta.total;
      approvedApps = ok.meta.total;
      if (canSeePayments) {
        const pays = await api.get('/payments', { params: { status: 'confirmed', limit: 100 } });
        collected = pays.data.reduce((s, p) => s + Number(p.amount), 0);
      }
    }
    return { programs, periods, totalApps, approvedApps, collected };
  }, [user.role]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} />;

  const { programs, periods, totalApps, approvedApps, collected } = data;
  const openPeriods = periods.filter((p) => p.is_open).length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/20 rounded-2xl p-6 md:p-8 shadow-xl">
        <span className="text-xs font-bold tracking-wider text-blue-400 uppercase bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
          System Status: Operational
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-3">Registration Management System (RMS)</h2>
        <p className="text-slate-300 text-sm md:text-base mt-2 max-w-3xl">
          Centralized portal for managing student enrollments, academic periods, tuition fees, and administrative audits.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={isApplicant ? 'My Applications' : 'Total Applications'} value={totalApps} color="text-blue-400" Icon={FileText} />
        <StatCard title="Open Periods" value={openPeriods} color="text-amber-400" Icon={Calendar} />
        <StatCard title={isApplicant ? 'Approved' : 'Approved Applications'} value={approvedApps} color="text-emerald-400" Icon={CheckCircle2} />
        {collected !== null && (
          <StatCard title="Confirmed Payments" value={money(collected)} color="text-purple-400" Icon={DollarSign} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <h3 className="text-lg font-bold text-white mb-4">Academic Programs</h3>
          <div className="space-y-3">
            {programs.slice(0, 4).map((p) => (
              <div key={p.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white text-sm">{p.name}</h4>
                  <p className="text-xs text-slate-400">{p.code}</p>
                </div>
                <span className="text-xs font-bold text-emerald-400">{money(p.tuition_fee)}</span>
              </div>
            ))}
            {programs.length === 0 && <p className="text-sm text-slate-500">No programs yet.</p>}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
          <h3 className="text-lg font-bold text-white mb-4">Registration Windows</h3>
          <div className="space-y-3">
            {periods.slice(0, 4).map((per) => (
              <div key={per.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white text-sm">{per.name}</h4>
                  <p className="text-xs text-slate-400">
                    {fmtDate(per.start_date)} to {fmtDate(per.end_date)}
                  </p>
                </div>
                <StatusBadge status={per.is_open ? 'open' : 'closed'} />
              </div>
            ))}
            {periods.length === 0 && <p className="text-sm text-slate-500">No registration periods yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}