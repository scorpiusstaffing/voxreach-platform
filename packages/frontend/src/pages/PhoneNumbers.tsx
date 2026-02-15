import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Plus, Phone, ArrowLeft, Trash2, Download, Settings, X } from 'lucide-react';

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

interface VapiNumber {
  id: string;
  number?: string;
  name?: string;
  provider: string;
  status: string;
  assistantId?: string;
  imported: boolean;
}

export default function PhoneNumbers() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [numbers, setNumbers] = useState<PhoneNum[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProvision, setShowProvision] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editNumber, setEditNumber] = useState<PhoneNum | null>(null);

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

  const deleteNumber = async (num: PhoneNum) => {
    const msg = num.provider === 'vapi'
      ? 'Release this phone number? It will be deleted from Vapi.'
      : 'Remove this phone number from Voxreach? (It won\'t be deleted from your provider)';
    if (!confirm(msg)) return;
    try {
      await api.delete(`/phone-numbers/${num.id}`);
      setNumbers((n) => n.filter((x) => x.id !== num.id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="p-8 max-w-5xl">
        <Link to="/dashboard" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Phone Numbers</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-50"
            >
              <Download className="w-4 h-4" /> Import Existing
            </button>
            <button
              onClick={() => setShowProvision(true)}
              className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-700"
            >
              <Plus className="w-4 h-4" /> Get New Number
            </button>
          </div>
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
            <p className="text-gray-500 mb-6">Get a new number or import an existing one from Vapi.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowImport(true)} className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-50">
                Import Existing
              </button>
              <button onClick={() => setShowProvision(true)} className="bg-brand-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-700">
                Get New Number
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {numbers.map((num) => (
              <div key={num.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900 font-mono text-lg">{num.number}</h3>
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
                      {num.assignedAgent ? (
                        <span className="text-brand-600 font-medium">→ {num.assignedAgent.name}</span>
                      ) : (
                        <span className="text-yellow-600">No agent assigned</span>
                      )}
                      {' · '}{num.type} · {num.country}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setEditNumber(num)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                      title="Configure"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteNumber(num)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
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

        {showProvision && (
          <ProvisionModal
            agents={agents}
            onClose={() => setShowProvision(false)}
            onCreated={() => { setShowProvision(false); loadNumbers(); }}
          />
        )}

        {showImport && (
          <ImportModal
            agents={agents}
            onClose={() => setShowImport(false)}
            onImported={() => { setShowImport(false); loadNumbers(); }}
          />
        )}

        {editNumber && (
          <EditNumberModal
            number={editNumber}
            agents={agents}
            onClose={() => setEditNumber(null)}
            onUpdated={() => { setEditNumber(null); loadNumbers(); }}
          />
        )}
      </div>
  );
}

// Provision new number
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
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Get New Phone Number</h2>
            <p className="text-sm text-gray-500 mt-0.5">Provision a free US number via Vapi</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Friendly Name</label>
            <input
              type="text"
              value={friendlyName}
              onChange={(e) => setFriendlyName(e.target.value)}
              placeholder="e.g., Main Line, Sales Number"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign to Agent</label>
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
            💡 This provisions a free US number through Vapi. Webhooks will be automatically configured.
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50">
              {loading ? 'Provisioning...' : 'Get Number'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Import existing Vapi numbers
function ImportModal({ agents, onClose, onImported }: { agents: Agent[]; onClose: () => void; onImported: () => void }) {
  const [vapiNumbers, setVapiNumbers] = useState<VapiNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/phone-numbers/vapi')
      .then((r) => setVapiNumbers(r.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const importNumber = async (vapiNum: VapiNumber) => {
    setImporting(vapiNum.id);
    setError('');
    try {
      await api.post('/phone-numbers/import', {
        vapiPhoneNumberId: vapiNum.id,
        friendlyName: vapiNum.name || undefined,
        assignedAgentId: selectedAgent[vapiNum.id] || undefined,
      });
      setVapiNumbers((nums) => nums.map((n) => n.id === vapiNum.id ? { ...n, imported: true } : n));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(null);
    }
  };

  const allImported = vapiNumbers.every((n) => n.imported);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Import from Vapi</h2>
            <p className="text-sm text-gray-500 mt-0.5">Import existing phone numbers from your Vapi account</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading Vapi numbers...</div>
          ) : vapiNumbers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No phone numbers found in your Vapi account</div>
          ) : (
            <div className="space-y-3">
              {vapiNumbers.map((num) => (
                <div key={num.id} className={`border rounded-xl p-4 ${num.imported ? 'border-green-200 bg-green-50/50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-gray-900">{num.number || 'SIP Number'}</span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{num.provider}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${num.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                          {num.status}
                        </span>
                      </div>
                      {num.name && <p className="text-sm text-gray-500 mt-0.5">{num.name}</p>}
                    </div>
                    {num.imported ? (
                      <span className="text-sm text-green-600 font-medium">✓ Imported</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedAgent[num.id] || ''}
                          onChange={(e) => setSelectedAgent((s) => ({ ...s, [num.id]: e.target.value }))}
                          className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg"
                        >
                          <option value="">No agent</option>
                          {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                        <button
                          onClick={() => importNumber(num)}
                          disabled={importing === num.id}
                          className="text-sm bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 disabled:opacity-50"
                        >
                          {importing === num.id ? '...' : 'Import'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={allImported ? onImported : onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">
              {allImported ? 'Done' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit number (assign agent)
function EditNumberModal({ number, agents, onClose, onUpdated }: { number: PhoneNum; agents: Agent[]; onClose: () => void; onUpdated: () => void }) {
  const [friendlyName, setFriendlyName] = useState(number.friendlyName || '');
  const [agentId, setAgentId] = useState(number.assignedAgent?.id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.patch(`/phone-numbers/${number.id}`, {
        friendlyName: friendlyName || null,
        assignedAgentId: agentId || null,
      });
      onUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Configure {number.number}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Friendly Name</label>
            <input type="text" value={friendlyName} onChange={(e) => setFriendlyName(e.target.value)} placeholder="e.g., Main Line" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned Agent</label>
            <select value={agentId} onChange={(e) => setAgentId(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none">
              <option value="">None</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">Inbound calls to this number will be handled by the assigned agent.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
