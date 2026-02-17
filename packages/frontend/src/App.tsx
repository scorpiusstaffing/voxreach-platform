import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import UnderConstruction from './pages/UnderConstruction';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Pricing from './pages/Pricing';
import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import Tools from './pages/Tools';
import PhoneNumbers from './pages/PhoneNumbers';
import Calls from './pages/Calls';
import Campaigns from './pages/Campaigns';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import CalendarSettings from './pages/CalendarSettings';
import Meetings from './pages/Meetings';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';

// Set this to true to enable under construction mode
const UNDER_CONSTRUCTION = true;

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100">
        <Layout>{children}</Layout>
      </div>
    </ProtectedRoute>
  );
}

// Construction mode wrapper
function ConstructionWrapper({ children }: { children: React.ReactNode }) {
  if (UNDER_CONSTRUCTION) {
    return <UnderConstruction />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<ConstructionWrapper><Login /></ConstructionWrapper>} />
      <Route path="/signup" element={<ConstructionWrapper><Signup /></ConstructionWrapper>} />
      <Route path="/pricing" element={<ConstructionWrapper><Pricing /></ConstructionWrapper>} />
      <Route path="/blog" element={<ConstructionWrapper><Blog /></ConstructionWrapper>} />
      <Route path="/blog/:slug" element={<ConstructionWrapper><BlogPost /></ConstructionWrapper>} />
      <Route path="/dashboard" element={<ConstructionWrapper><ProtectedLayout><Dashboard /></ProtectedLayout></ConstructionWrapper>} />
      <Route path="/dashboard/agents" element={<ConstructionWrapper><ProtectedLayout><Agents /></ProtectedLayout></ConstructionWrapper>} />
      <Route path="/dashboard/tools" element={<ConstructionWrapper><ProtectedLayout><Tools /></ProtectedLayout></ConstructionWrapper>} />
      <Route path="/dashboard/numbers" element={<ConstructionWrapper><ProtectedLayout><PhoneNumbers /></ProtectedLayout></ConstructionWrapper>} />
      <Route path="/dashboard/calls" element={<ConstructionWrapper><ProtectedLayout><Calls /></ProtectedLayout></ConstructionWrapper>} />
      <Route path="/dashboard/campaigns" element={<ConstructionWrapper><ProtectedLayout><Campaigns /></ProtectedLayout></ConstructionWrapper>} />
      <Route path="/dashboard/billing" element={<ConstructionWrapper><ProtectedLayout><Billing /></ProtectedLayout></ConstructionWrapper>} />
      <Route path="/dashboard/calendar" element={<ConstructionWrapper><ProtectedLayout><CalendarSettings /></ProtectedLayout></ConstructionWrapper>} />
      <Route path="/dashboard/meetings" element={<ConstructionWrapper><ProtectedLayout><Meetings /></ProtectedLayout></ConstructionWrapper>} />
      <Route path="/dashboard/settings" element={<ConstructionWrapper><ProtectedLayout><Settings /></ProtectedLayout></ConstructionWrapper>} />
    </Routes>
  );
}
