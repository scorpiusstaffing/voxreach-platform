import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { 
  Plus, Phone, ArrowLeft, Trash2, Settings, X, 
  ChevronRight, Server, Globe, PhoneCall, 
  Key, AlertCircle, Loader2
} from 'lucide-react';

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

interface Credential {
  id: string;
  provider: string;
  name: string | null;
  vapiCredentialId: string | null;
  createdAt: string;
}

type ProviderType = 'vapi' | 'twilio' | 'vonage' | 'telnyx' | 'byo-sip-trunk';

interface ProviderConfig {
  id: ProviderType;
  name: string;
  description: string;
  icon: React.ReactNode;
  requiresCredential: boolean;
  requiresNumber: boolean;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Import a number from your Twilio account',
    icon: <PhoneCall className="w-6 h-6" />,
    requiresCredential: false,
    requiresNumber: true,
  },
  {
    id: 'vonage',
    name: 'Vonage',
    description: 'Import a number from your Vonage account',
    icon: <Globe className="w-6 h-6" />,
    requiresCredential: true,
    requiresNumber: true,
  },
  {
    id: 'telnyx',
    name: 'Telnyx',
    description: 'Import a number from your Telnyx account',
    icon: <Server className="w-6 h-6" />,
    requiresCredential: true,
    requiresNumber: true,
  },
  {
    id: 'byo-sip-trunk',
    name: 'BYO SIP Trunk',
    description: 'Bring your own SIP trunk number',
    icon: <Server className="w-6 h-6" />,
    requiresCredential: true,
    requiresNumber: true,
  },
  {
    id: 'vapi',
    name: 'Vapi Number',
    description: 'Get a free test number (US only)',
    icon: <Phone className="w-6 h-6" />,
    requiresCredential: false,
    requiresNumber: false,
  },
];

export default function PhoneNumbers() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [numbers, setNumbers] = useState<PhoneNum[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editNumber, setEditNumber] = useState<PhoneNum | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [numbersRes, agentsRes, credsRes] = await Promise.all([
        api.get('/phone-numbers'),
        api.get('/agents'),
        api.get('/credentials'),
      ]);
      setNumbers(numbersRes.data);
      setAgents(agentsRes.data);
      setCredentials(credsRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteNumber = async (num: PhoneNum) => {
    const msg = num.provider === 'vapi'
      ? 'Release this phone number? It will be deleted from Vapi.'
      : 'Remove this phone number from Voxreach? (It will not be deleted from your provider)';
    if (!confirm(msg)) return;
    try {
      await api.delete(`/phone-numbers/${num.id}`);
      setNumbers((n) => n.filter((x) => x.id !== num.id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getProviderBadgeColor = (provider: string) => {
    switch (provider) {
      case 'twilio': return 'bg-blue-50 text-blue-700';
      case 'vonage': return 'bg-purple-50 text-purple-700';
      case 'telnyx': return 'bg-green-50 text-green-700';
      case 'byo-phone-number':
      case 'byo-sip-trunk': return 'bg-orange-50 text-orange-700';
      case 'vapi': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
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
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" /> Add Phone Number
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
          <p className="text-gray-500 mb-6">Add a phone number from your preferred provider.</p>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="bg-brand-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-700"
          >
            Add Phone Number
          </button>
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
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getProviderBadgeColor(num.provider)}`}>
                      {num.provider === 'byo-phone-number' ? 'BYO SIP' : num.provider}
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

      {showAddModal && (
        <AddNumberModal
          agents={agents}
          credentials={credentials}
          onClose={() => setShowAddModal(false)}
          onCreated={() => { setShowAddModal(false); loadData(); }}
          onCredentialsChanged={() => loadData()}
        />
      )}

      {editNumber && (
        <EditNumberModal
          number={editNumber}
          agents={agents}
          onClose={() => setEditNumber(null)}
          onUpdated={() => { setEditNumber(null); loadData(); }}
        />
      )}
    </div>
  );
}

// Add Number Modal with multi-step flow
function AddNumberModal({ 
  agents, 
  credentials, 
  onClose, 
  onCreated, 
  onCredentialsChanged 
}: { 
  agents: Agent[]; 
  credentials: Credential[];
  onClose: () => void; 
  onCreated: () => void;
  onCredentialsChanged: () => void;
}) {
  const [step, setStep] = useState<'provider' | 'credentials' | 'details'>('provider');
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null);
  const [selectedCredential, setSelectedCredential] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    number: '',
    sipUri: '',
    friendlyName: '',
    assignedAgentId: '',
    twilioAccountSid: '',
    twilioAuthToken: '',
    vonageApiKey: '',
    vonageApiSecret: '',
    telnyxApiKey: '',
    gatewayIp: '',
    gatewayPort: '5060',
    authUsername: '',
    authPassword: '',
  });

  const provider = PROVIDERS.find(p => p.id === selectedProvider);

  const handleProviderSelect = (providerId: ProviderType) => {
    setSelectedProvider(providerId);
    const p = PROVIDERS.find(p => p.id === providerId);
    if (p?.requiresCredential) {
      const existingCreds = credentials.filter(c => c.provider === providerId);
      if (existingCreds.length > 0) {
        setSelectedCredential(existingCreds[0].id);
      }
      setStep('credentials');
    } else {
      setStep('details');
    }
  };

  const handleCreateCredential = async () => {
    setLoading(true);
    setError('');
    try {
      let payload: any = { provider: selectedProvider };
      
      if (selectedProvider === 'vonage') {
        payload.vonageApiKey = formData.vonageApiKey;
        payload.vonageApiSecret = formData.vonageApiSecret;
        payload.name = `Vonage - ${formData.vonageApiKey.slice(0, 8)}...`;
      } else if (selectedProvider === 'telnyx') {
        payload.telnyxApiKey = formData.telnyxApiKey;
        payload.name = `Telnyx - ${formData.telnyxApiKey.slice(0, 8)}...`;
      } else if (selectedProvider === 'byo-sip-trunk') {
        payload.gateways = [{
          ip: formData.gatewayIp,
          port: parseInt(formData.gatewayPort) || 5060,
        }];
        if (formData.authUsername) {
          payload.outboundAuthenticationPlan = {
            authUsername: formData.authUsername,
            authPassword: formData.authPassword,
          };
        }
        payload.name = `BYO SIP - ${formData.gatewayIp}`;
      }

      const res = await api.post('/credentials', payload);
      setSelectedCredential(res.data.id);
      onCredentialsChanged();
      setStep('details');
    } catch (err: any) {
      setError(err.message || 'Failed to create credential');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      let payload: any = {
        provider: selectedProvider,
        friendlyName: formData.friendlyName || undefined,
        assignedAgentId: formData.assignedAgentId || undefined,
      };

      if (selectedProvider === 'vapi') {
        // Vapi numbers are auto-generated
      } else if (selectedProvider === 'twilio') {
        payload.number = formData.number;
        payload.twilioAccountSid = formData.twilioAccountSid;
        payload.twilioAuthToken = formData.twilioAuthToken;
      } else if (selectedProvider === 'byo-sip-trunk') {
        payload.provider = 'byo-phone-number';
        payload.credentialId = selectedCredential;
        if (formData.sipUri) {
          payload.sipUri = formData.sipUri;
        } else {
          payload.number = formData.number;
        }
        payload.numberE164CheckEnabled = true;
      } else {
        payload.credentialId = selectedCredential;
        payload.number = formData.number;
      }

      await api.post('/phone-numbers', payload);
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create phone number');
    } finally {
      setLoading(false);
    }
  };

  const filteredCredentials = credentials.filter(c => c.provider === selectedProvider);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {step === 'provider' && 'Add Phone Number'}
              {step === 'credentials' && 'Provider Credentials'}
              {step === 'details' && 'Number Details'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {step === 'provider' && 'Choose your phone number provider'}
              {step === 'credentials' && `${provider?.name} authentication`}
              {step === 'details' && 'Configure your phone number'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 'provider' && (
            <div className="space-y-3">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProviderSelect(p.id)}
                  className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-brand-300 hover:bg-brand-50/30 transition-colors text-left"
                >
                  <div className="p-3 bg-gray-100 rounded-lg text-gray-600">
                    {p.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{p.name}</div>
                    <div className="text-sm text-gray-500">{p.description}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          )}

          {step === 'credentials' && provider && (
            <div className="space-y-4">
              {filteredCredentials.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Use existing credential
                  </label>
                  <select
                    value={selectedCredential}
                    onChange={(e) => setSelectedCredential(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="">Create new credential...</option>
                    {filteredCredentials.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || `${c.provider} credential`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(!selectedCredential || filteredCredentials.length === 0) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Key className="w-4 h-4" />
                    <span>Enter your {provider.name} credentials</span>
                  </div>

                  {selectedProvider === 'vonage' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">API Key</label>
                        <input
                          type="text"
                          value={formData.vonageApiKey}
                          onChange={(e) => setFormData(d => ({ ...d, vonageApiKey: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                          placeholder="Your Vonage API Key"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">API Secret</label>
                        <input
                          type="password"
                          value={formData.vonageApiSecret}
                          onChange={(e) => setFormData(d => ({ ...d, vonageApiSecret: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                          placeholder="Your Vonage API Secret"
                        />
                      </div>
                    </>
                  )}

                  {selectedProvider === 'telnyx' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">API Key</label>
                      <input
                        type="password"
                        value={formData.telnyxApiKey}
                        onChange={(e) => setFormData(d => ({ ...d, telnyxApiKey: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                        placeholder="Your Telnyx API Key"
                      />
                    </div>
                  )}

                  {selectedProvider === 'byo-sip-trunk' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Gateway IP Address</label>
                        <input
                          type="text"
                          value={formData.gatewayIp}
                          onChange={(e) => setFormData(d => ({ ...d, gatewayIp: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                          placeholder="e.g., 192.168.1.1 or sip.example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Gateway Port (optional)</label>
                        <input
                          type="text"
                          value={formData.gatewayPort}
                          onChange={(e) => setFormData(d => ({ ...d, gatewayPort: e.target.value }))}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                          placeholder="5060"
                        />
                      </div>
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <div className="text-sm font-medium text-gray-700 mb-3">Authentication (optional)</div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Username</label>
                            <input
                              type="text"
                              value={formData.authUsername}
                              onChange={(e) => setFormData(d => ({ ...d, authUsername: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                            <input
                              type="password"
                              value={formData.authPassword}
                              onChange={(e) => setFormData(d => ({ ...d, authPassword: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={() => setStep('provider')} 
                      className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreateCredential}
                      disabled={loading || (
                        selectedProvider === 'vonage' 
                          ? !formData.vonageApiKey || !formData.vonageApiSecret
                          : selectedProvider === 'telnyx'
                          ? !formData.telnyxApiKey
                          : !formData.gatewayIp
                      )}
                      className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {selectedCredential && (
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setStep('provider')} 
                    className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('details')}
                    className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-5">
              {selectedProvider !== 'vapi' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {selectedProvider === 'byo-sip-trunk' ? 'Phone Number or SIP URI' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={selectedProvider === 'byo-sip-trunk' ? (formData.number || formData.sipUri) : formData.number}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (selectedProvider === 'byo-sip-trunk' && value.startsWith('sip:')) {
                        setFormData(d => ({ ...d, sipUri: value, number: '' }));
                      } else {
                        setFormData(d => ({ ...d, number: value, sipUri: '' }));
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder={selectedProvider === 'byo-sip-trunk' ? '+1234567890 or sip:user@example.com' : '+1234567890'}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedProvider === 'byo-sip-trunk' 
                      ? 'Enter E.164 format number or SIP URI (sip:user@domain.com)'
                      : 'Enter the phone number in E.164 format (e.g., +1234567890)'}
                  </p>
                </div>
              )}

              {selectedProvider === 'twilio' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Account SID</label>
                    <input
                      type="text"
                      value={formData.twilioAccountSid}
                      onChange={(e) => setFormData(d => ({ ...d, twilioAccountSid: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                      placeholder="AC..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Auth Token</label>
                    <input
                      type="password"
                      value={formData.twilioAuthToken}
                      onChange={(e) => setFormData(d => ({ ...d, twilioAuthToken: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Friendly Name (optional)</label>
                <input
                  type="text"
                  value={formData.friendlyName}
                  onChange={(e) => setFormData(d => ({ ...d, friendlyName: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="e.g., Main Line, Sales Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign to Agent (optional)</label>
                <select
                  value={formData.assignedAgentId}
                  onChange={(e) => setFormData(d => ({ ...d, assignedAgentId: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value="">Assign later</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              {selectedProvider === 'vapi' && (
                <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                  This provisions a free US number through Vapi for testing purposes.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => selectedProvider === 'vapi' ? setStep('provider') : setStep('credentials')} 
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || (
                    selectedProvider === 'vapi' 
                      ? false 
                      : selectedProvider === 'twilio'
                      ? !formData.number || !formData.twilioAccountSid || !formData.twilioAuthToken
                      : !formData.number && !formData.sipUri
                  )}
                  className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {selectedProvider === 'vapi' ? 'Get Number' : 'Import Number'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Edit number modal
function EditNumberModal({ number, agents, onClose, onUpdated }: { number: PhoneNum; agents: Agent[]; onClose: () => void; onUpdated: () => void }) {
  const [friendlyName, setFriendlyName] = useState(number.friendlyName || '');
  const [agentId, setAgentId] = useState(number.assignedAgent?.id || '');
  const [isActive, setIsActive] = useState(number.isActive);
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
        isActive,
      });
      onUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update');
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
            <input 
              type="text" 
              value={friendlyName} 
              onChange={(e) => setFriendlyName(e.target.value)} 
              placeholder="e.g., Main Line" 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned Agent</label>
            <select 
              value={agentId} 
              onChange={(e) => setAgentId(e.target.value)} 
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="">None</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">Inbound calls to this number will be handled by the assigned agent.</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Number is active
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

