import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ErrorBox, inputCls, labelCls } from '../components/ui';

export default function AuthPage({ mode = 'login' }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => setError(''), [mode]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
        });
      }
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700/80 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl text-white mb-4 shadow-lg shadow-blue-500/30">
            <Building className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">Registration Management System</h1>
          <p className="text-slate-400 text-sm mt-1">
            {isLogin ? 'Sign in to access your dashboard' : 'Create a new applicant account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorBox message={error} />

          {!isLogin && (
            <>
              <div>
                <label className={labelCls}>Full Name</label>
                <input required className={inputCls} value={form.full_name} onChange={set('full_name')} placeholder="Your full name" />
              </div>
              <div>
                <label className={labelCls}>Phone (optional)</label>
                <input className={inputCls} value={form.phone} onChange={set('phone')} placeholder="+251..." />
              </div>
            </>
          )}

          <div>
            <label className={labelCls}>Email Address</label>
            <input type="email" required className={inputCls} value={form.email} onChange={set('email')} placeholder="name@university.edu" />
          </div>

          <div>
            <label className={labelCls}>Password</label>
            <input
              type="password"
              required
              minLength={isLogin ? 1 : 8}
              className={inputCls}
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
            />
            {!isLogin && <p className="text-xs text-slate-500 mt-1">At least 8 characters.</p>}
          </div>

          <button type="submit" disabled={busy} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-medium py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 mt-2 text-sm">
            {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {busy ? 'Please wait...' : isLogin ? 'Sign In' : 'Register Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to={isLogin ? '/register' : '/login'}
            className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-700/60 text-xs text-slate-500 text-center">
          RMS Portal v1.0 • Secure University Admissions & Records
        </div>
      </div>
    </div>
  );
}