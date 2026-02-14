import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Phone, Users, PhoneCall, BarChart3, Plus, LogOut, Settings, PhoneOutgoing } from 'lucide-react';

interface Stats {
  totalAgents: number;
  totalNumbers: number;
  totalCalls: number;
  activeCampaigns: number;
  totalMinutes: number;
  recentCalls: any[];
}

export default function Dashboard() {
  const { user, organization, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      api.get('/dashboard/stats')
        .then((res) => setStats(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || !user || !organization) return null;

  const isOutbound = organization.intent === 'outbound';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="text-xl font-bold text-brand-700 tracking-tight">Voxreach</div>
          <div className="mt-1 text-xs text-gray-400">{organization.name}</div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavItem icon={<BarChart3 className="w-5 h-5" />} label="Dashboard" href="/dashboard" active />
          <NavItem icon={<Users className="w-5 h-5" />} label="Agents" href="/dashboard/agents" />
          <NavItem icon={<Phone className="w-5 h-5" />} label="Phone Numbers" href="/dashboard/numbers" />
          <NavItem icon={<PhoneCall className="w-5 h-5" />} label="Calls" href="/dashboard/calls" />
          {isOutbound && (
            <NavItem icon={<PhoneOutgoing className="w-5 h-5" />} label="Campaigns" href="/dashboard/campaigns" />
          )}
          <NavItem icon={<Settings className="w-5 h-5" />} label="Settings" href="/dashboard/settings" />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-medium text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
              <div className="text-xs text-gray-400 truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {isOutbound ? 'Outbound Dashboard' : 'Inbound Dashboard'}
              </h1>
              <p className="text-gray-500 mt-1">
                {isOutbound
                  ? 'Manage your AI sales and outreach agents'
                  : 'Manage your AI receptionist and call handling'}
              </p>
            </div>
            <Link
              to="/dashboard/agents"
              className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Agent
            </Link>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="grid grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-20 mb-3" />
                  <div className="h-8 bg-gray-100 rounded w-12" />
                </div>
              ))}
            </div>
          ) : stats && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <StatCard label="Active Agents" value={stats.totalAgents} icon={<Users className="w-5 h-5 text-brand-500" />} />
                <StatCard label="Phone Numbers" value={stats.totalNumbers} icon={<Phone className="w-5 h-5 text-green-500" />} />
                <StatCard label="Total Calls" value={stats.totalCalls} icon={<PhoneCall className="w-5 h-5 text-purple-500" />} />
                <StatCard label="Minutes Used" value={stats.totalMinutes} icon={<BarChart3 className="w-5 h-5 text-orange-500" />} />
              </div>

              {/* Recent Calls */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Recent Calls</h2>
                </div>
                {stats.recentCalls.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-400">
                    No calls yet. Create an agent and make your first call!
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {stats.recentCalls.map((call: any) => (
                      <div key={call.id} className="px-6 py-4 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{call.toNumber || call.fromNumber}</div>
                          <div className="text-xs text-gray-400">
                            {call.agent?.name || 'Unknown agent'} · {new Date(call.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          call.status === 'completed' ? 'bg-green-50 text-green-700' :
                          call.status === 'failed' ? 'bg-red-50 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {call.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, href, active }: { icon: React.ReactNode; label: string; href: string; active?: boolean }) {
  return (
    <Link
      to={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}
