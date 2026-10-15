import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ROLES } from './constants/roles';
import AuthPage from './pages/AuthPage';
import DashboardLayout from './layouts/DashboardLayout';
import OverviewPage from './pages/OverviewPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ProgramsPage from './pages/ProgramsPage';
import PeriodsPage from './pages/PeriodsPage';
import FeesPage from './pages/FeesPage';
import PaymentsPage from './pages/PaymentsPage';
import UsersPage from './pages/UsersPage';
import AuditPage from './pages/AuditPage';

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function GuestOnly({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function RequireRole({ roles, children }) {
  const { user } = useAuth();
  return roles.includes(user.role) ? children : <Navigate to="/dashboard" replace />;
}

function UserPage({ Component }) {
  const { user } = useAuth();
  return <Component user={user} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<GuestOnly><AuthPage mode="login" /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><AuthPage mode="register" /></GuestOnly>} />

        <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
          <Route path="/dashboard" element={<UserPage Component={OverviewPage} />} />
          <Route path="/applications" element={<UserPage Component={ApplicationsPage} />} />
          <Route path="/programs" element={<UserPage Component={ProgramsPage} />} />
          <Route path="/periods" element={<UserPage Component={PeriodsPage} />} />
          <Route path="/fees" element={<UserPage Component={FeesPage} />} />
          <Route
            path="/payments"
            element={
              <RequireRole roles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE, ROLES.AUDITOR, ROLES.APPLICANT]}>
                <UserPage Component={PaymentsPage} />
              </RequireRole>
            }
          />
          <Route
            path="/users"
            element={
              <RequireRole roles={[ROLES.SUPER_ADMIN]}>
                <UserPage Component={UsersPage} />
              </RequireRole>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <RequireRole roles={[ROLES.SUPER_ADMIN, ROLES.AUDITOR]}>
                <UserPage Component={AuditPage} />
              </RequireRole>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}