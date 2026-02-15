import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Plus, Bot, Pencil, Trash2, ArrowLeft, Phone, Play, Zap, ChevronDown, X, Volume2, Brain, Mic, Wrench, FileText, Sparkles } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  direction: string;
  isActive: boolean;
  voiceProvider: string;
  voiceId: string;
  language: string;
  systemPrompt: string;
  firstMessage: string;
  transferNumber: string | null;
  phoneNumbers: { id: string; number: string; friendlyName: string }[];
  tools: { id: string; name: string; type: string }[];
  vapiConfig: any;
  createdAt: string;
}

interface VoiceOption {
  provider: string;
  voiceId: string;
  name: string;
  gender: string;
  accent: string;
}

interface ModelOption {
  provider: string;
  model: string;
  name: string;
  description: string;
}

interface Template {
  id: string;
  name: string;
  direction: string;
  systemPrompt: string;
  firstMessage: string;
  voiceProvider: string;
  voiceId: string;
  backgroundSound: string;
  maxDurationSeconds: number;
  firstMessageMode: string;
  voicemailDetection: boolean;
  voicemailMessage?: string;
}

interface Tool {
  id: string;
  name: string;
  description: string;
  type: string;
}

export default function Agents() {
  const { user, organization, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [testCallAgent, setTestCallAgent] = useState<Agent | null>(null);

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
    if (!confirm('Delete this agent? This will also remove it from Vapi.')) return;
    try {
      await api.delete(`/agents/${id}`);
      setAgents((a) => a.filter((x) => x.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleActive = async (agent: Agent) => {
    try {
      await api.patch(`/agents/${agent.id}`, { isActive: !agent.isActive });
      loadAgents();
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
              <div key={agent.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                      <button
                        onClick={() => toggleActive(agent)}
                        className={`text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                          agent.isActive ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
                        {agent.direction}
                      </span>
                      {agent.tools?.length > 0 && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 flex items-center gap-1">
                          <Wrench className="w-3 h-3" /> {agent.tools.length} tool{agent.tools.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                      <span className="flex items-center gap-1"><Volume2 className="w-3.5 h-3.5" /> {agent.voiceProvider}/{agent.voiceId}</span>
                      <span className="flex items-center gap-1"><Mic className="w-3.5 h-3.5" /> {agent.language}</span>
                    </div>
                    {agent.phoneNumbers.length > 0 && (
                      <div className="flex items-center gap-1 text-sm text-gray-400 mt-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        {agent.phoneNumbers.map((p) => p.friendlyName || p.number).join(', ')}
                      </div>
                    )}
                    <p className="text-sm text-gray-400 mt-2 line-clamp-2">{agent.systemPrompt.substring(0, 120)}...</p>
                  </div>
                  <div className="flex gap-1.5 ml-4">
                    {agent.direction === 'outbound' && (
                      <button
                        onClick={() => setTestCallAgent(agent)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                        title="Test call"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setEditAgent(agent)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteAgent(agent.id)}
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

        {showCreate && (
          <CreateAgentModal
            intent={organization?.intent || 'outbound'}
            onClose={() => setShowCreate(false)}
            onCreated={() => { setShowCreate(false); loadAgents(); }}
          />
        )}

        {editAgent && (
          <EditAgentModal
            agent={editAgent}
            onClose={() => setEditAgent(null)}
            onUpdated={() => { setEditAgent(null); loadAgents(); }}
          />
        )}

        {testCallAgent && (
          <TestCallModal
            agent={testCallAgent}
            onClose={() => setTestCallAgent(null)}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================
// Create Agent Modal
// ============================================================
function CreateAgentModal({ intent, onClose, onCreated }: { intent: string; onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState<'template' | 'configure'>('template');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [voiceOptions, setVoiceOptions] = useState<VoiceOption[]>([]);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [orgTools, setOrgTools] = useState<Tool[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'voice' | 'tools' | 'analysis'>('basic');

  const [form, setForm] = useState({
    name: '',
    direction: intent,
    systemPrompt: '',
    firstMessage: '',
    voiceProvider: '11labs',
    voiceId: 'rachel',
    voiceSpeed: 1.0,
    modelProvider: 'openai',
    modelName: 'gpt-4o',
    temperature: 0.7,
    maxTokens: undefined as number | undefined,
    language: 'en',
    transferNumber: '',
    maxDurationSeconds: intent === 'outbound' ? 300 : 600,
    backgroundSound: intent === 'outbound' ? 'office' : 'off',
    firstMessageMode: 'assistant-speaks-first',
    voicemailDetection: intent === 'outbound',
    voicemailMessage: '',
    endCallMessage: '',
    silenceTimeoutSeconds: 30,
    endCallFunctionEnabled: false,
    firstMessageInterruptionsEnabled: false,
    recordingEnabled: true,
    transcriberProvider: 'deepgram',
    transcriberModel: 'nova-3',
    transcriberConfig: {
      confidenceThreshold: 0.4,
      wordBoost: [] as string[],
      keytermsPrompt: '',
      endUtteranceSilenceThreshold: 700,
    },
    toolIds: [] as string[],
    knowledgeBaseEnabled: false,
    knowledgeBaseFiles: [] as string[],
    analysisEnabled: false,
    analysisSummaryPrompt: '',
    analysisSuccessEvaluation: '',
    analysisStructuredDataEnabled: false,
    analysisStructuredDataSchema: {} as Record<string, any>,
    analysisStructuredDataPrompt: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/agents/templates').then((r) => setTemplates(r.data)),
      api.get('/agents/voice-options').then((r) => setVoiceOptions(r.data)),
      api.get('/agents/model-options').then((r) => setModelOptions(r.data)),
      api.get('/tools').then((r) => setOrgTools(r.data)).catch(() => setOrgTools([])),
    ]).catch(console.error);
  }, []);

  const applyTemplate = (t: Template) => {
    setForm((f) => ({
      ...f,
      name: t.name,
      direction: t.direction,
      systemPrompt: t.systemPrompt,
      firstMessage: t.firstMessage,
      voiceProvider: t.voiceProvider,
      voiceId: t.voiceId,
      backgroundSound: t.backgroundSound || f.backgroundSound,
      maxDurationSeconds: t.maxDurationSeconds || f.maxDurationSeconds,
      firstMessageMode: t.firstMessageMode || f.firstMessageMode,
      voicemailDetection: t.voicemailDetection ?? f.voicemailDetection,
      voicemailMessage: t.voicemailMessage || f.voicemailMessage,
    }));
    setStep('configure');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: any = {
        ...form,
        transferNumber: form.transferNumber || undefined,
        voicemailMessage: form.voicemailMessage || undefined,
        endCallMessage: form.endCallMessage || undefined,
        maxTokens: form.maxTokens || undefined,
      };

      if (form.analysisEnabled) {
        payload.analysisPlan = {
          ...(form.analysisSummaryPrompt && { summaryPrompt: form.analysisSummaryPrompt }),
          ...(form.analysisSuccessEvaluation && { successEvaluation: form.analysisSuccessEvaluation }),
          ...(form.analysisStructuredDataEnabled && form.analysisStructuredDataSchema && {
            structuredDataSchema: form.analysisStructuredDataSchema,
            ...(form.analysisStructuredDataPrompt && { structuredDataPrompt: form.analysisStructuredDataPrompt }),
          }),
        };
      }

      if (form.knowledgeBaseEnabled && form.knowledgeBaseFiles.length > 0) {
        payload.knowledgeBase = {
          provider: 'canonical',
          fileIds: form.knowledgeBaseFiles,
        };
      }

      payload.transcriberConfig = {
        confidenceThreshold: form.transcriberConfig.confidenceThreshold,
        ...(form.transcriberConfig.wordBoost.length > 0 && { wordBoost: form.transcriberConfig.wordBoost }),
        ...(form.transcriberConfig.keytermsPrompt && { keytermsPrompt: form.transcriberConfig.keytermsPrompt }),
        endUtteranceSilenceThreshold: form.transcriberConfig.endUtteranceSilenceThreshold,
      };

      await api.post('/agents', payload);
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));
  const updateTranscriber = (field: string, value: any) => setForm((f) => ({
    ...f,
    transcriberConfig: { ...f.transcriberConfig, [field]: value },
  }));

  const filteredVoices = voiceOptions.filter((v) => v.provider === form.voiceProvider);

  const voiceProviders = [
    { id: '11labs', name: 'ElevenLabs' },
    { id: 'deepgram', name: 'Deepgram' },
    { id: 'openai', name: 'OpenAI' },
    { id: 'vapi', name: 'Vapi' },
    { id: 'azure', name: 'Azure' },
    { id: 'playht', name: 'PlayHT' },
    { id: 'cartesia', name: 'Cartesia' },
  ];

  const transcriberProviders = [
    { id: 'deepgram', name: 'Deepgram', models: ['nova-3', 'nova-2', 'enhanced', 'base'] },
    { id: 'assembly-ai', name: 'AssemblyAI', models: ['best', 'nano'] },
  ];

  const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab; label: string; icon: any }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        activeTab === id ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{step === 'template' ? 'Choose a Template' : 'Configure Agent'}</h2>
            {step === 'template' && <p className="text-sm text-gray-500 mt-0.5">Start with a template or build from scratch</p>}
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        {step === 'template' ? (
          <div className="p-6 space-y-3">
            {templates.filter((t) => t.direction === intent || intent === 'both').map((t) => (
              <button key={t.id} onClick={() => applyTemplate(t)} className="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-brand-300 hover:bg-brand-50/30 transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-brand-500" />
                  <span className="font-medium text-gray-900">{t.name}</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t.direction}</span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">{t.systemPrompt.substring(0, 150)}...</p>
              </button>
            ))}
            <button onClick={() => setStep('configure')} className="w-full text-left p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-2 mb-1"><Plus className="w-4 h-4 text-gray-400" /><span className="font-medium text-gray-700">Build from scratch</span></div>
              <p className="text-sm text-gray-400">Create a custom agent</p>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col h-[calc(90vh-140px)]">
            {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 m-6 mb-0">{error}</div>}

            <div className="px-6 pt-4 border-b border-gray-100">
              <div className="flex gap-2">
                <TabButton id="basic" label="Basic" icon={Bot} />
                <TabButton id="voice" label="Voice & AI" icon={Volume2} />
                <TabButton id="tools" label="Tools & KB" icon={Wrench} />
                <TabButton id="analysis" label="Analysis" icon={Sparkles} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'basic' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Agent Name</label>
                    <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g., Sales Agent" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Opening Message</label>
                    <input type="text" value={form.firstMessage} onChange={(e) => update('firstMessage', e.target.value)} placeholder="Hi, this is..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Agent Instructions</label>
                    <textarea value={form.systemPrompt} onChange={(e) => update('systemPrompt', e.target.value)} rows={6} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none resize-none font-mono text-sm" placeholder="You are a professional..." required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Transfer Number</label>
                    <input type="tel" value={form.transferNumber} onChange={(e) => update('transferNumber', e.target.value)} placeholder="+1234567890" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Max Duration (seconds)</label>
                      <input type="number" value={form.maxDurationSeconds} onChange={(e) => update('maxDurationSeconds', parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Silence Timeout (seconds)</label>
                      <input type="number" value={form.silenceTimeoutSeconds} onChange={(e) => update('silenceTimeoutSeconds', parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.voicemailDetection} onChange={(e) => update('voicemailDetection', e.target.checked)} className="accent-brand-600 w-4 h-4" />
                    <span className="text-sm text-gray-700">Detect voicemail and leave a message</span>
                  </label>
                  {form.voicemailDetection && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Voicemail Message</label>
                      <textarea value={form.voicemailMessage} onChange={(e) => update('voicemailMessage', e.target.value)} rows={2} placeholder="Hi, this is..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'voice' && (
                <div className="space-y-5">
                  <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Volume2 className="w-4 h-4" /> Voice Settings</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Provider</label>
                        <select value={form.voiceProvider} onChange={(e) => { update('voiceProvider', e.target.value); const firstVoice = voiceOptions.find((v) => v.provider === e.target.value); if (firstVoice) update('voiceId', firstVoice.voiceId); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                          {voiceProviders.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Voice</label>
                        <select value={form.voiceId} onChange={(e) => update('voiceId', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                          {filteredVoices.map((v) => (<option key={v.voiceId} value={v.voiceId}>{v.name} ({v.gender}, {v.accent})</option>))}
                        </select>
                      </div>
                    </div>
                    <div><label className="block text-xs text-gray-500 mb-1">Voice Speed: {form.voiceSpeed}x</label><input type="range" min="0.5" max="2" step="0.1" value={form.voiceSpeed} onChange={(e) => update('voiceSpeed', parseFloat(e.target.value))} className="w-full" /></div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Brain className="w-4 h-4" /> AI Model</div>
                    <div className="grid grid-cols-1 gap-2">
                      {modelOptions.map((m) => (
                        <label key={`${m.provider}/${m.model}`} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${form.modelProvider === m.provider && form.modelName === m.model ? 'border-brand-500 bg-brand-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <input type="radio" name="model" checked={form.modelProvider === m.provider && form.modelName === m.model} onChange={() => { update('modelProvider', m.provider); update('modelName', m.model); }} className="accent-brand-600" />
                          <div><span className="text-sm font-medium text-gray-900">{m.name}</span><span className="text-xs text-gray-400 ml-2">{m.description}</span></div>
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-xs text-gray-500 mb-1">Temperature: {form.temperature}</label><input type="range" min="0" max="1" step="0.1" value={form.temperature} onChange={(e) => update('temperature', parseFloat(e.target.value))} className="w-full" /></div>
                      <div><label className="block text-xs text-gray-500 mb-1">Max Tokens</label><input type="number" value={form.maxTokens || ''} onChange={(e) => update('maxTokens', e.target.value ? parseInt(e.target.value) : undefined)} placeholder="Unlimited" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Mic className="w-4 h-4" /> Transcriber</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Provider</label>
                        <select value={form.transcriberProvider} onChange={(e) => update('transcriberProvider', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                          {transcriberProviders.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Model</label>
                        <select value={form.transcriberModel} onChange={(e) => update('transcriberModel', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                          {transcriberProviders.find(p => p.id === form.transcriberProvider)?.models.map(m => (<option key={m} value={m}>{m}</option>))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Language</label>
                      <select value={form.language} onChange={(e) => update('language', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        <option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option><option value="de">German</option>
                        <option value="pt">Portuguese</option><option value="it">Italian</option><option value="nl">Dutch</option><option value="ja">Japanese</option>
                        <option value="zh">Chinese</option><option value="ko">Korean</option><option value="hi">Hindi</option><option value="ar">Arabic</option><option value="th">Thai</option>
                      </select>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-500 mb-2">Advanced Transcriber Settings</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Confidence Threshold</label>
                          <input type="number" min="0" max="1" step="0.1" value={form.transcriberConfig.confidenceThreshold} onChange={(e) => updateTranscriber('confidenceThreshold', parseFloat(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Silence Threshold (ms)</label>
                          <input type="number" value={form.transcriberConfig.endUtteranceSilenceThreshold} onChange={(e) => updateTranscriber('endUtteranceSilenceThreshold', parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="block text-xs text-gray-500 mb-1">Key Terms (comma separated)</label>
                        <input type="text" value={form.transcriberConfig.keytermsPrompt} onChange={(e) => updateTranscriber('keytermsPrompt', e.target.value)} placeholder="company name, product name, industry terms" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tools' && (
                <div className="space-y-5">
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Wrench className="w-4 h-4" /> Tools</div>
                    <p className="text-xs text-gray-500">Select tools this agent can use during calls</p>
                    {orgTools.length === 0 ? (
                      <div className="text-sm text-gray-500 py-4 text-center">No tools available. <Link to="/dashboard/tools" className="text-brand-600 hover:underline">Create tools</Link> first.</div>
                    ) : (
                      <div className="space-y-2">
                        {orgTools.map((tool) => (
                          <label key={tool.id} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-white transition-colors">
                            <input type="checkbox" checked={form.toolIds.includes(tool.id)} onChange={(e) => { if (e.target.checked) update('toolIds', [...form.toolIds, tool.id]); else update('toolIds', form.toolIds.filter(id => id !== tool.id)); }} className="accent-brand-600 mt-0.5" />
                            <div>
                              <div className="font-medium text-sm text-gray-900">{tool.name}</div>
                              <div className="text-xs text-gray-500">{tool.description}</div>
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-1 inline-block">{tool.type}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><FileText className="w-4 h-4" /> Knowledge Base</div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={form.knowledgeBaseEnabled} onChange={(e) => update('knowledgeBaseEnabled', e.target.checked)} className="accent-brand-600 w-4 h-4" />
                      <span className="text-sm text-gray-700">Enable Knowledge Base</span>
                    </label>
                    {form.knowledgeBaseEnabled && (
                      <div className="pl-7 space-y-2">
                        <p className="text-xs text-gray-500">Upload files in the Tools page to use them here.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'analysis' && (
                <div className="space-y-5">
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Sparkles className="w-4 h-4" /> Post-Call Analysis</div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={form.analysisEnabled} onChange={(e) => update('analysisEnabled', e.target.checked)} className="accent-brand-600 w-4 h-4" />
                      <span className="text-sm text-gray-700">Enable Analysis</span>
                    </label>
                    {form.analysisEnabled && (
                      <div className="pl-7 space-y-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Summary Prompt (optional)</label>
                          <textarea value={form.analysisSummaryPrompt} onChange={(e) => update('analysisSummaryPrompt', e.target.value)} rows={2} placeholder="Summarize the call focusing on..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Success Evaluation (optional)</label>
                          <textarea value={form.analysisSuccessEvaluation} onChange={(e) => update('analysisSuccessEvaluation', e.target.value)} rows={2} placeholder="Determine if the call was successful by..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={form.analysisStructuredDataEnabled} onChange={(e) => update('analysisStructuredDataEnabled', e.target.checked)} className="accent-brand-600 w-4 h-4" />
                          <span className="text-sm text-gray-700">Extract Structured Data</span>
                        </label>
                        {form.analysisStructuredDataEnabled && (
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">JSON Schema (optional)</label>
                            <textarea value={JSON.stringify(form.analysisStructuredDataSchema, null, 2)} onChange={(e) => { try { update('analysisStructuredDataSchema', JSON.parse(e.target.value)); } catch {} }} rows={4} placeholder='{"type": "object", "properties": {...}}' className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono resize-none" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button type="button" onClick={() => step === 'configure' ? setStep('template') : onClose()} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">{step === 'configure' ? 'Back' : 'Cancel'}</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50">{loading ? 'Creating...' : 'Create Agent'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
