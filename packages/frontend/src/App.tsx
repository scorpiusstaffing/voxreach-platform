import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import PhoneNumbers from './pages/PhoneNumbers';
import Calls from './pages/Calls';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard/agents" element={<ProtectedRoute><Agents /></ProtectedRoute>} />
      <Route path="/dashboard/numbers" element={<ProtectedRoute><PhoneNumbers /></ProtectedRoute>} />
      <Route path="/dashboard/calls" element={<ProtectedRoute><Calls /></ProtectedRoute>} />
    </Routes>
  );
}
