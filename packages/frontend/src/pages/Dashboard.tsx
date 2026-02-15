import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Phone, Users, PhoneCall, BarChart3, Plus, PhoneOutgoing } from 'lucide-react';

interface Stats {
  totalAgents: number;
  totalNumbers: number;
  totalCalls: number;
  activeCampaigns: number;
  totalMinutes: number;
  recentCalls: any[];
}

export default function Dashboard() {
  const { organization } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!organization) return null;
  const isOutbound = organization.intent === 'outbound';

  return (
    <div className="p-8 max-w-6xl">
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
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Recent Calls</h2>
              <Link to="/dashboard/calls" className="text-sm text-brand-600 hover:underline">
                View all
              </Link>
            </div>
            {stats.recentCalls.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400">
                No calls yet. Create an agent and make your first call!
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {stats.recentCalls.slice(0, 5).map((call: any) => (
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

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-6 mt-8">
            <QuickActionCard
              title="Create Agent"
              description="Build a new AI voice agent"
              icon={<Users className="w-6 h-6 text-brand-500" />}
              href="/dashboard/agents"
            />
            <QuickActionCard
              title="Add Phone Number"
              description="Provision a new number"
              icon={<Phone className="w-6 h-6 text-green-500" />}
              href="/dashboard/numbers"
            />
            {isOutbound && (
              <QuickActionCard
                title="Start Campaign"
                description="Launch an outreach campaign"
                icon={<PhoneOutgoing className="w-6 h-6 text-purple-500" />}
                href="/dashboard/campaigns"
              />
            )}
          </div>
        </>
      )}
    </div>
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

function QuickActionCard({ title, description, icon, href }: { title: string; description: string; icon: React.ReactNode; href: string }) {
  return (
    <Link to={href} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-brand-300 hover:shadow-sm transition-all">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-gray-50 rounded-xl">{icon}</div>
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );
}
