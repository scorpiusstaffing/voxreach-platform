import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Plus, Bot, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Agent {
  id: string;
  name: string;
  direction: string;
  isActive: boolean;
  voiceProvider: string;
  voiceId: string;
  language: string;
  phoneNumbers: { id: string; number: string; friendlyName: string }[];
  createdAt: string;
}

export default function Agents() {
  const { user, organization, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading]);

  useEffect(() => {
    loadAgents();
  }, [user]);

  const loadAgents = () => {
    if (user) {
      api.get('/agents')
        .then((res) => setAgents(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  const deleteAgent = async (id: string) => {
    if (!confirm('Delete this agent? This cannot be undone.')) return;
    try {
      await api.delete(`/agents/${id}`);
      setAgents((a) => a.filter((x) => x.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 ml-64 p-8">
      <div className="max-w-4xl">
        <Link to="/dashboard" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Agents</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Agent
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="h-5 bg-gray-100 rounded w-40 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-60" />
              </div>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No agents yet</h3>
            <p className="text-gray-500 mb-6">Create your first AI voice agent to start making or receiving calls.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-brand-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-700"
            >
              Create Agent
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {agents.map((agent) => (
              <div key={agent.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        agent.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                        {agent.direction}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {agent.voiceProvider} / {agent.voiceId} · {agent.language}
                    </div>
                    {agent.phoneNumbers.length > 0 && (
                      <div className="text-sm text-gray-400 mt-1">
                        📞 {agent.phoneNumbers.map((p) => p.friendlyName || p.number).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteAgent(agent.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Agent Modal */}
        {showCreate && (
          <CreateAgentModal
            intent={organization?.intent || 'outbound'}
            onClose={() => setShowCreate(false)}
            onCreated={() => { setShowCreate(false); loadAgents(); }}
          />
        )}
      </div>
    </div>
  );
}

function CreateAgentModal({ intent, onClose, onCreated }: { intent: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '',
    direction: intent,
    systemPrompt: intent === 'outbound'
      ? 'You are a professional sales representative. Be friendly, clear, and focused on understanding the prospect\'s needs.'
      : 'You are a friendly receptionist. Answer calls professionally, help with bookings, and capture lead information.',
    firstMessage: intent === 'outbound'
      ? 'Hi, this is Sarah from {{company}}. Is this a good time to talk?'
      : 'Thank you for calling {{company}}. How can I help you today?',
    voiceProvider: '11labs',
    voiceId: 'rachel',
    language: 'en',
    transferNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/agents', form);
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Create Agent</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Agent Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g., Sales Agent, Receptionist"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">First Message</label>
            <input
              type="text"
              value={form.firstMessage}
              onChange={(e) => update('firstMessage', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Agent Instructions</label>
            <textarea
              value={form.systemPrompt}
              onChange={(e) => update('systemPrompt', e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none resize-none"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Tell the agent what to do, how to behave, and what to say.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Voice</label>
              <select
                value={form.voiceId}
                onChange={(e) => update('voiceId', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value="rachel">Rachel (Female)</option>
                <option value="drew">Drew (Male)</option>
                <option value="clyde">Clyde (Male)</option>
                <option value="sarah">Sarah (Female)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Language</label>
              <select
                value={form.language}
                onChange={(e) => update('language', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="pt">Portuguese</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Transfer Number (optional)</label>
            <input
              type="tel"
              value={form.transferNumber}
              onChange={(e) => update('transferNumber', e.target.value)}
              placeholder="+1234567890"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">Forward calls here when the AI can't help.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
