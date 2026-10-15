import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, BookOpen, CreditCard, LogOut,
  Building, DollarSign, Menu, X, Calendar, History,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants/roles';

export function getNavItems(role) {
  const items = [
    { to: '/dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { to: '/applications', label: 'Applications', icon: FileText },
    { to: '/programs', label: 'Programs', icon: BookOpen },
    { to: '/periods', label: 'Registration Periods', icon: Calendar },
    { to: '/fees', label: 'Fee Structures', icon: DollarSign },
  ];
  if ([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE, ROLES.AUDITOR, ROLES.APPLICANT].includes(role)) {
    items.push({ to: '/payments', label: 'Payments & Receipts', icon: CreditCard });
  }
  if (role === ROLES.SUPER_ADMIN) items.push({ to: '/users', label: 'User Directory', icon: Users });
  if ([ROLES.SUPER_ADMIN, ROLES.AUDITOR].includes(role)) {
    items.push({ to: '/audit-logs', label: 'Audit Logs', icon: History });
  }
  return items;
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = getNavItems(user.role);
  const activeLabel = navItems.find((n) => n.to === pathname)?.label || '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white">
            <Building className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg">RMS Portal</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-slate-300 hover:text-white">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static flex flex-col ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-slate-800 hidden md:flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-base leading-tight">RMS Portal</h2>
            <span className="text-xs text-blue-400 font-medium">{user.role}</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30">
              {user.fullName?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
        <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-slate-800 bg-slate-900/30 backdrop-blur-md sticky top-0 z-40">
          <div>
            <h1 className="text-xl font-bold text-white">{activeLabel}</h1>
            <p className="text-xs text-slate-400">Welcome back, {user.fullName}</p>
          </div>
          <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-semibold">
            Role: {user.role}
          </span>
        </header>

        <div className="p-4 md:p-8 flex-1 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}