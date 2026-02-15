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
      case 'twilio': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'vonage': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'telnyx': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'byo-phone-number':
      case 'byo-sip-trunk': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'vapi': return 'bg-[#161B22] text-[#9CA3AF] border-[#21262D]';
      default: return 'bg-[#161B22] text-[#9CA3AF] border-[#21262D]';
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="p-8 max-w-5xl">
      <Link to="/dashboard" className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-white mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-white">Phone Numbers</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 btn-cyan px-5 py-2.5"
        >
          <Plus className="w-4 h-4" /> Add Phone Number
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
      ) : numbers.length === 0 ? (
        <div className="bg-[#161B22] rounded-xl border border-[#21262D] p-12 text-center">
          <Phone className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No phone numbers yet</h3>
          <p className="text-[#9CA3AF] mb-6">Add a phone number from your preferred provider.</p>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="btn-cyan px-6 py-2.5"
          >
            Add Phone Number
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {numbers.map((num) => (
            <div key={num.id} className="bg-[#161B22] rounded-xl border border-[#21262D] p-6 card-glow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-white font-mono text-lg">{num.number}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      num.isActive ? 'badge-success-dark' : 'badge-neutral-dark'
                    }`}>
                      {num.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getProviderBadgeColor(num.provider)}`}>
                      {num.provider === 'byo-phone-number' ? 'BYO SIP' : num.provider}
                    </span>
                  </div>
                  {num.friendlyName && (
                    <div className="text-sm text-[#9CA3AF] mt-1">{num.friendlyName}</div>
                  )}
                  <div className="text-sm text-[#6B7280] mt-1">
                    {num.assignedAgent ? (
                      <span className="text-cyan-400 font-medium">→ {num.assignedAgent.name}</span>
                    ) : (
                      <span className="text-yellow-400">No agent assigned</span>
                    )}
                    {' · '}{num.type} · {num.country}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setEditNumber(num)}
                    className="p-2 text-[#6B7280] hover:text-white hover:bg-[#21262D] rounded-lg transition-colors"
                    title="Configure"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteNumber(num)}
                    className="p-2 text-[#6B7280] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
