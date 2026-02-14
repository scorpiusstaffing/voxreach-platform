import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Plus, Phone, ArrowLeft, Trash2 } from 'lucide-react';

interface PhoneNum {
  id: string;
  number: string;
  type: string;
  provider: string;
  friendlyName: string | null;
  country: string;
  isActive: boolean;
  assignedAgent: { id: string; name: string } | null;
  createdAt: string;
}

interface Agent {
  id: string;
  name: string;
}

export default function PhoneNumbers() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [numbers, setNumbers] = useState<PhoneNum[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProvision, setShowProvision] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      Promise.all([
        api.get('/phone-numbers').then((r) => setNumbers(r.data)),
        api.get('/agents').then((r) => setAgents(r.data)),
      ])
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  const loadNumbers = () => {
    api.get('/phone-numbers').then((r) => setNumbers(r.data)).catch(console.error);
  };

  const deleteNumber = async (id: string) => {
    if (!confirm('Release this phone number? This cannot be undone.')) return;
    try {
      await api.delete(`/phone-numbers/${id}`);
      setNumbers((n) => n.filter((x) => x.id !== id));
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
          <h1 className="text-2xl font-semibold text-gray-900">Phone Numbers</h1>
          <button
            onClick={() => setShowProvision(true)}
            className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-700"
          >
            <Plus className="w-4 h-4" /> Get Number
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
        ) : numbers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Phone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No phone numbers yet</h3>
            <p className="text-gray-500 mb-6">Get a phone number to start making and receiving AI calls.</p>
            <button
              onClick={() => setShowProvision(true)}
              className="bg-brand-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-700"
            >
              Get Number
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {numbers.map((num) => (
              <div key={num.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900 font-mono">{num.number}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        num.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {num.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {num.provider}
                      </span>
                    </div>
                    {num.friendlyName && (
                      <div className="text-sm text-gray-500 mt-1">{num.friendlyName}</div>
                    )}
                    <div className="text-sm text-gray-400 mt-1">
                      {num.assignedAgent ? `Assigned to: ${num.assignedAgent.name}` : 'No agent assigned'}
                      {' · '}{num.type} · {num.country}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteNumber(num.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Provision Modal */}
        {showProvision && (
          <ProvisionModal
            agents={agents}
            onClose={() => setShowProvision(false)}
            onCreated={() => { setShowProvision(false); loadNumbers(); }}
          />
        )}
      </div>
    </div>
  );
}

function ProvisionModal({ agents, onClose, onCreated }: { agents: Agent[]; onClose: () => void; onCreated: () => void }) {
  const [friendlyName, setFriendlyName] = useState('');
  const [agentId, setAgentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/phone-numbers', {
        friendlyName: friendlyName || undefined,
        assignedAgentId: agentId || undefined,
      });
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Get Phone Number</h2>
          <p className="text-sm text-gray-500 mt-1">Provision a free US phone number via Vapi</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Friendly Name (optional)</label>
            <input
              type="text"
              value={friendlyName}
              onChange={(e) => setFriendlyName(e.target.value)}
              placeholder="e.g., Main Line, Sales Number"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign to Agent (optional)</label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="">None — assign later</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
            💡 This provisions a free US number through Vapi (up to 10 per account).
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50">
              {loading ? 'Provisioning...' : 'Get Number'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
