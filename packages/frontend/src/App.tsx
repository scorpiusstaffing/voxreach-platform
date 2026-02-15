import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import Tools from './pages/Tools';
import PhoneNumbers from './pages/PhoneNumbers';
import Calls from './pages/Calls';
import Campaigns from './pages/Campaigns';
import Settings from './pages/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/dashboard/agents" element={<ProtectedLayout><Agents /></ProtectedLayout>} />
      <Route path="/dashboard/tools" element={<ProtectedLayout><Tools /></ProtectedLayout>} />
      <Route path="/dashboard/numbers" element={<ProtectedLayout><PhoneNumbers /></ProtectedLayout>} />
      <Route path="/dashboard/calls" element={<ProtectedLayout><Calls /></ProtectedLayout>} />
      <Route path="/dashboard/campaigns" element={<ProtectedLayout><Campaigns /></ProtectedLayout>} />
      <Route path="/dashboard/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
    </Routes>
  );
}
