import { ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SalesProvider } from './context/SalesContext';
import { Role } from './types';
import { Layout } from './ui';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import AdminDashboard from './pages/AdminDashboard';
import AdminEmployees from './pages/AdminEmployees';
import EmployeeDashboard from './pages/EmployeeDashboard';

// Route guard = authorization on the client (the real enforcement is in the API)
function Guard({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <SalesProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify" element={<VerifyOtp />} />
            <Route path="/admin" element={<Guard role="admin"><AdminDashboard /></Guard>} />
            <Route path="/admin/employees" element={<Guard role="admin"><AdminEmployees /></Guard>} />
            <Route path="/employee" element={<Guard role="employee"><EmployeeDashboard /></Guard>} />
          </Routes>
        </HashRouter>
      </SalesProvider>
    </AuthProvider>
  );
}
