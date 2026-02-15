import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Plus, ArrowLeft, Megaphone, Calendar, Target, Users, Play, Pause, Trash2, Edit, BarChart3 } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  agentId: string;
  agent?: { id: string; name: string };
  contactListId?: string;
  totalContacts: number;
  callsMade: number;
  callsConnected: number;
  callsSuccessful: number;
  createdAt: string;
  scheduledAt?: string;
}

export default function Campaigns() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading]);

  useEffect(() => {
    loadCampaigns();
  }, [user]);

  const loadCampaigns = () => {
    if (user) {
      api.get('/campaigns')
        .then((res) => setCampaigns(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  const toggleCampaignStatus = async (campaign: Campaign) => {
    const newStatus = campaign.status === 'running' ? 'paused' : 'running';
    try {
      await api.patch(`/campaigns/${campaign.id}`, { status: newStatus });
      loadCampaigns();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Delete this campaign? This cannot be undone.')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      setCampaigns((c) => c.filter((x) => x.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="p-8 max-w-5xl">
      <Link to="/dashboard" className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#9CA3AF] mb-4">
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Campaigns</h1>
          <p className="text-[#6B7280] mt-1">Create and manage outbound calling campaigns</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-cyan-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-cyan-400 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-[#161B22] rounded-xl border border-[#21262D] p-6 animate-pulse">
              <div className="h-5 bg-[#21262D] rounded w-40 mb-2" />
              <div className="h-4 bg-[#21262D] rounded w-60" />
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-[#161B22] rounded-xl border border-[#21262D] p-12 text-center">
          <Megaphone className="w-12 h-12 text-[#4B5563] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No campaigns yet</h3>
          <p className="text-[#6B7280] mb-6">Create your first campaign to start making outbound calls at scale.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-cyan-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-cyan-400"
          >
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-[#161B22] rounded-xl border border-[#21262D] p-6 hover:shadow-[0_0_30px_rgba(0,180,216,0.08)] transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-white">{campaign.name}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      campaign.status === 'running' ? 'bg-green-50 text-green-700' :
                      campaign.status === 'paused' ? 'bg-yellow-50 text-yellow-700' :
                      campaign.status === 'completed' ? 'bg-[#21262D] text-[#9CA3AF]' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                  {campaign.description && (
                    <p className="text-sm text-[#6B7280] mt-1">{campaign.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-[#6B7280] mt-2">
                    <span className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" /> {campaign.totalContacts} contacts
                    </span>
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3.5 h-3.5" /> {campaign.callsMade} calls made
                    </span>
                    {campaign.agent && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Agent: {campaign.agent.name}
                      </span>
                    )}
                  </div>
                  {campaign.callsMade > 0 && (
                    <div className="mt-3 flex gap-4 text-xs text-[#6B7280]">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        {campaign.callsConnected} connected ({Math.round((campaign.callsConnected / campaign.callsMade) * 100)}%)
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-brand-400" />
                        {campaign.callsSuccessful} successful ({Math.round((campaign.callsSuccessful / campaign.callsMade) * 100)}%)
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5 ml-4">
                  {(campaign.status === 'running' || campaign.status === 'paused') && (
                    <button
                      onClick={() => toggleCampaignStatus(campaign)}
                      className={`p-2 rounded-lg ${
                        campaign.status === 'running'
                          ? 'text-yellow-600 hover:bg-yellow-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={campaign.status === 'running' ? 'Pause' : 'Resume'}
                    >
                      {campaign.status === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  )}
                  <button
                    onClick={() => deleteCampaign(campaign.id)}
                    className="p-2 text-[#6B7280] hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateCampaignModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadCampaigns(); }}
        />
      )}
    </div>
  );
}

// ============================================================
// Create Campaign Modal
// ============================================================
function CreateCampaignModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    agentId: '',
  });
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/agents')
      .then((res) => setAgents(res.data))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/campaigns', form);
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#161B22] rounded-2xl w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-[#21262D] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Create Campaign</h2>
          <button onClick={onClose} className="p-2 text-[#6B7280] hover:text-[#9CA3AF]">
            <span className="sr-only">Close</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-[#E5E7EB] mb-1.5">Campaign Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g., Q1 Sales Outreach"
              className="w-full px-4 py-2.5 border border-[#21262D] rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#E5E7EB] mb-1.5">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              placeholder="Describe the purpose of this campaign..."
              className="w-full px-4 py-2.5 border border-[#21262D] rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#E5E7EB] mb-1.5">Select Agent</label>
            <select
              value={form.agentId}
              onChange={(e) => update('agentId', e.target.value)}
              className="w-full px-4 py-2.5 border border-[#21262D] rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
              required
            >
              <option value="">Choose an agent...</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
            {agents.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No agents available. <Link to="/dashboard/agents" className="underline">Create one first</Link>.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[#21262D] rounded-lg font-medium text-[#E5E7EB] hover:bg-[#0A0E17]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !form.agentId}
              className="flex-1 py-2.5 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-400 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
