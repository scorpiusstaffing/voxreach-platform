import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Plus, Bot, Pencil, Trash2, ArrowLeft, Phone, Play, Zap, ChevronDown, X, Volume2, Brain, Mic, Wrench, Sparkles } from 'lucide-react';

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
  vapiConfig?: any;
  tools?: { id: string; name: string }[];
  phoneNumbers: { id: string; number: string; friendlyName: string }[];
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
  type: string;
  description: string;
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
    <div className="p-8 max-w-5xl">
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
                    {agent.tools && agent.tools.length > 0 && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 flex items-center gap-1">
                        <Wrench className="w-3 h-3" /> {agent.tools.length} tool{agent.tools.length > 1 ? 's' : ''}
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
          key={showCreate ? 'create-modal' : 'hidden'}
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [form, setForm] = useState({
    name: '', direction: intent, systemPrompt: '', firstMessage: '',
    voiceProvider: 'vapi', voiceId: 'Elliot', voiceSpeed: 1.0,
    modelProvider: 'openai', modelName: 'gpt-4o', temperature: 0.7,
    maxTokens: undefined as number | undefined, language: 'en', transferNumber: '',
    maxDurationSeconds: intent === 'outbound' ? 300 : 600,
    backgroundSound: intent === 'outbound' ? 'office' : 'off',
    firstMessageMode: 'assistant-speaks-first', voicemailDetection: intent === 'outbound',
    voicemailMessage: '', endCallMessage: '', silenceTimeoutSeconds: 30,
    endCallFunctionEnabled: false, firstMessageInterruptionsEnabled: false, recordingEnabled: true,
    transcriberProvider: 'deepgram' as 'deepgram' | 'assembly-ai', transcriberModel: 'nova-3',
    transcriberConfig: { confidenceThreshold: 0.4, wordBoost: [] as string[], keytermsPrompt: '', endUtteranceSilenceThreshold: 700 },
    toolIds: [] as string[], analysisEnabled: false, analysisSummaryPrompt: '', analysisSuccessEvaluation: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Reset state when modal opens
    setStep('template');
    setError('');
    setShowAdvanced(false);
    setForm({
      name: '', direction: intent, systemPrompt: '', firstMessage: '',
      voiceProvider: 'vapi', voiceId: 'Elliot', voiceSpeed: 1.0,
      modelProvider: 'openai', modelName: 'gpt-4o', temperature: 0.7,
      maxTokens: undefined, language: 'en', transferNumber: '',
      maxDurationSeconds: intent === 'outbound' ? 300 : 600,
      backgroundSound: intent === 'outbound' ? 'office' : 'off',
      firstMessageMode: 'assistant-speaks-first', voicemailDetection: intent === 'outbound',
      voicemailMessage: '', endCallMessage: '', silenceTimeoutSeconds: 30,
      endCallFunctionEnabled: false, firstMessageInterruptionsEnabled: false, recordingEnabled: true,
      transcriberProvider: 'deepgram', transcriberModel: 'nova-3',
      transcriberConfig: { confidenceThreshold: 0.4, wordBoost: [], keytermsPrompt: '', endUtteranceSilenceThreshold: 700 },
      toolIds: [], analysisEnabled: false, analysisSummaryPrompt: '', analysisSuccessEvaluation: '',
    });

    Promise.all([
      api.get('/agents/templates').then((r) => setTemplates(r.data)),
      api.get('/agents/voice-options').then((r) => setVoiceOptions(r.data)),
      api.get('/agents/model-options').then((r) => setModelOptions(r.data)),
      api.get('/tools').then((r) => setOrgTools(r.data)).catch(() => setOrgTools([])),
    ]).catch(console.error);
  }, []);

  const applyTemplate = (t: Template) => {
    setForm((f) => ({ ...f, name: t.name, direction: t.direction, systemPrompt: t.systemPrompt, firstMessage: t.firstMessage,
      voiceProvider: t.voiceProvider, voiceId: t.voiceId, backgroundSound: t.backgroundSound || f.backgroundSound,
      maxDurationSeconds: t.maxDurationSeconds || f.maxDurationSeconds, firstMessageMode: t.firstMessageMode || f.firstMessageMode,
      voicemailDetection: t.voicemailDetection ?? f.voicemailDetection, voicemailMessage: t.voicemailMessage || f.voicemailMessage,
    }));
    setError(''); // Clear error when switching templates
    setStep('configure');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: any = { ...form, transferNumber: form.transferNumber || undefined, voicemailMessage: form.voicemailMessage || undefined,
        endCallMessage: form.endCallMessage || undefined, maxTokens: form.maxTokens || undefined,
        transcriberConfig: { confidenceThreshold: form.transcriberConfig.confidenceThreshold, endUtteranceSilenceThreshold: form.transcriberConfig.endUtteranceSilenceThreshold,
          ...(form.transcriberConfig.wordBoost.length > 0 && { wordBoost: form.transcriberConfig.wordBoost }),
          ...(form.transcriberConfig.keytermsPrompt && { keytermsPrompt: form.transcriberConfig.keytermsPrompt }),
        },
      };
      if (form.analysisEnabled) {
        payload.analysisPlan = { ...(form.analysisSummaryPrompt && { summaryPrompt: form.analysisSummaryPrompt }), ...(form.analysisSuccessEvaluation && { successEvaluation: form.analysisSuccessEvaluation }) };
      }
      await api.post('/agents', payload);
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));
  const filteredVoices = voiceOptions.filter((v) => v.provider === form.voiceProvider);
  // Voice providers that work without extra credentials: vapi, deepgram, openai, azure
  // Voice providers that require API keys: 11labs (most voices), cartesia, playht, rime-ai, lmnt, neets
  const voiceProviders = [
    { id: 'vapi', name: 'Vapi (built-in)' },
    { id: 'deepgram', name: 'Deepgram' },
    { id: 'openai', name: 'OpenAI' },
    { id: 'azure', name: 'Azure' },
    { id: '11labs', name: 'ElevenLabs' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900">{step === 'template' ? 'Choose a Template' : 'Configure Agent'}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        {step === 'template' ? (
          <div className="p-6 space-y-3">
            {templates.filter((t) => t.direction === intent || intent === 'both').map((t) => (
              <button key={t.id} onClick={() => applyTemplate(t)} className="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-brand-300 hover:bg-brand-50/30 transition-all">
                <div className="flex items-center gap-2 mb-1"><Zap className="w-4 h-4 text-brand-500" /><span className="font-medium text-gray-900">{t.name}</span><span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t.direction}</span></div>
                <p className="text-sm text-gray-500 line-clamp-2">{t.systemPrompt.substring(0, 150)}...</p>
              </button>
            ))}
            <button onClick={() => setStep('configure')} className="w-full text-left p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-2 mb-1"><Plus className="w-4 h-4 text-gray-400" /><span className="font-medium text-gray-700">Build from scratch</span></div>
              <p className="text-sm text-gray-400">Create a custom agent with your own instructions</p>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Agent Name</label><input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g., Sales Agent" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Opening Message</label><input type="text" value={form.firstMessage} onChange={(e) => update('firstMessage', e.target.value)} placeholder="Hi, this is Sarah from..." className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Agent Instructions</label><textarea value={form.systemPrompt} onChange={(e) => update('systemPrompt', e.target.value)} rows={5} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none resize-none font-mono text-sm" placeholder="You are a professional sales representative..." required /></div>
            
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Volume2 className="w-4 h-4" /> Voice</div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Provider</label><select value={form.voiceProvider} onChange={(e) => { const newProvider = e.target.value; const first = voiceOptions.find((v) => v.provider === newProvider); update('voiceProvider', newProvider); update('voiceId', first?.voiceId || ''); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{voiceProviders.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}</select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Voice</label><select value={form.voiceId} onChange={(e) => update('voiceId', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{filteredVoices.map((v) => (<option key={v.voiceId} value={v.voiceId}>{v.name} ({v.gender}, {v.accent})</option>))}</select></div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Brain className="w-4 h-4" /> AI Model</div>
              <div className="grid grid-cols-1 gap-2">{modelOptions.map((m) => (<label key={`${m.provider}/${m.model}`} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${form.modelProvider === m.provider && form.modelName === m.model ? 'border-brand-500 bg-brand-50/50' : 'border-gray-200 hover:border-gray-300'}`}><input type="radio" name="model" checked={form.modelProvider === m.provider && form.modelName === m.model} onChange={() => { update('modelProvider', m.provider); update('modelName', m.model); }} className="accent-brand-600" /><div><span className="text-sm font-medium text-gray-900">{m.name}</span><span className="text-xs text-gray-400 ml-2">{m.description}</span></div></label>))}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Language</label><select value={form.language} onChange={(e) => update('language', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"><option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option><option value="de">German</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Transfer Number</label><input type="tel" value={form.transferNumber} onChange={(e) => update('transferNumber', e.target.value)} placeholder="+1234567890" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg" /></div>
            </div>

            {orgTools.length > 0 && (
              <div className="bg-purple-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Wrench className="w-4 h-4 text-purple-600" /> Tools</div>
                <div className="space-y-2">{orgTools.map((tool) => (<label key={tool.id} className="flex items-start gap-3 p-3 bg-white border border-purple-100 rounded-lg cursor-pointer hover:bg-purple-50/50"><input type="checkbox" checked={form.toolIds.includes(tool.id)} onChange={(e) => update('toolIds', e.target.checked ? [...form.toolIds, tool.id] : form.toolIds.filter((id) => id !== tool.id))} className="accent-brand-600 w-4 h-4 mt-0.5" /><div><div className="flex items-center gap-2"><span className="text-sm font-medium text-gray-900">{tool.name}</span><span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tool.type}</span></div><p className="text-xs text-gray-500 mt-0.5">{tool.description}</p></div></label>))}</div>
              </div>
            )}

            <div className="bg-amber-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Sparkles className="w-4 h-4 text-amber-600" /> Post-Call Analysis</div>
              <label className="flex items-center gap-3 cursor-pointer bg-white p-3 rounded-lg border border-amber-100"><input type="checkbox" checked={form.analysisEnabled} onChange={(e) => update('analysisEnabled', e.target.checked)} className="accent-brand-600 w-4 h-4" /><span className="text-sm text-gray-700">Enable AI analysis after each call</span></label>
              {form.analysisEnabled && (
                <div className="space-y-3 pl-7">
                  <div><label className="block text-xs text-gray-500 mb-1">Summary Prompt</label><textarea value={form.analysisSummaryPrompt} onChange={(e) => update('analysisSummaryPrompt', e.target.value)} rows={2} placeholder="Summarize the call focusing on..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Success Evaluation</label><textarea value={form.analysisSuccessEvaluation} onChange={(e) => update('analysisSuccessEvaluation', e.target.value)} rows={2} placeholder="The call was successful if..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" /></div>
                </div>
              )}
            </div>

            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} /> Advanced Settings</button>

            {showAdvanced && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-gray-500 mb-1">Max Duration (sec)</label><input type="number" value={form.maxDurationSeconds} onChange={(e) => update('maxDurationSeconds', parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Silence Timeout (sec)</label><input type="number" value={form.silenceTimeoutSeconds} onChange={(e) => update('silenceTimeoutSeconds', parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs text-gray-500 mb-1">Background Sound</label><select value={form.backgroundSound} onChange={(e) => update('backgroundSound', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="off">None</option><option value="office">Office</option></select></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Who Speaks First</label><select value={form.firstMessageMode} onChange={(e) => update('firstMessageMode', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"><option value="assistant-speaks-first">Agent speaks first</option><option value="assistant-waits-for-user">Wait for customer</option></select></div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.voicemailDetection} onChange={(e) => update('voicemailDetection', e.target.checked)} className="accent-brand-600 w-4 h-4" /><span className="text-sm text-gray-700">Detect voicemail</span></label>
                {form.voicemailDetection && <div><label className="block text-xs text-gray-500 mb-1">Voicemail Message</label><textarea value={form.voicemailMessage} onChange={(e) => update('voicemailMessage', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" /></div>}
                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.endCallFunctionEnabled} onChange={(e) => update('endCallFunctionEnabled', e.target.checked)} className="accent-brand-600 w-4 h-4" /><span className="text-sm text-gray-700">Allow AI to end call</span></label>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { if (step === 'configure') { setError(''); setStep('template'); } else { onClose(); } }} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">{step === 'configure' ? 'Back' : 'Cancel'}</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50">{loading ? 'Creating...' : 'Create Agent'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Edit Agent Modal
// ============================================================
function EditAgentModal({ agent, onClose, onUpdated }: { agent: Agent; onClose: () => void; onUpdated: () => void }) {
  const config = agent.vapiConfig || {};
  const [form, setForm] = useState({
    name: agent.name, systemPrompt: agent.systemPrompt, firstMessage: agent.firstMessage,
    voiceProvider: agent.voiceProvider, voiceId: agent.voiceId, voiceSpeed: config.voiceSpeed ?? 1.0,
    modelProvider: config.modelProvider || 'openai', modelName: config.modelName || 'gpt-4o',
    temperature: config.temperature ?? 0.7, maxTokens: config.maxTokens,
    language: agent.language, transferNumber: agent.transferNumber || '',
    maxDurationSeconds: config.maxDurationSeconds || (agent.direction === 'outbound' ? 300 : 600),
    backgroundSound: config.backgroundSound || (agent.direction === 'outbound' ? 'office' : 'off'),
    firstMessageMode: config.firstMessageMode || 'assistant-speaks-first',
    voicemailDetection: config.voicemailDetection ?? (agent.direction === 'outbound'),
    voicemailMessage: config.voicemailMessage || '', endCallMessage: config.endCallMessage || '',
    silenceTimeoutSeconds: config.silenceTimeoutSeconds || 30,
    endCallFunctionEnabled: config.endCallFunctionEnabled ?? false,
    firstMessageInterruptionsEnabled: config.firstMessageInterruptionsEnabled ?? false,
    transcriberProvider: config.transcriberProvider || 'deepgram', transcriberModel: config.transcriberModel || 'nova-3',
    transcriberConfig: { confidenceThreshold: config.transcriberConfig?.confidenceThreshold ?? 0.4, wordBoost: config.transcriberConfig?.wordBoost || [], keytermsPrompt: config.transcriberConfig?.keytermsPrompt || '', endUtteranceSilenceThreshold: config.transcriberConfig?.endUtteranceSilenceThreshold ?? 700 },
    toolIds: agent.tools?.map(t => t.id) || [], analysisEnabled: !!config.analysisPlan,
    analysisSummaryPrompt: config.analysisPlan?.summaryPrompt || '', analysisSuccessEvaluation: config.analysisPlan?.successEvaluation || '',
  });
  const [voiceOptions, setVoiceOptions] = useState<VoiceOption[]>([]);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [orgTools, setOrgTools] = useState<Tool[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/agents/voice-options').then((r) => setVoiceOptions(r.data)),
      api.get('/agents/model-options').then((r) => setModelOptions(r.data)),
      api.get('/tools').then((r) => setOrgTools(r.data)).catch(() => setOrgTools([])),
    ]).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: any = { ...form, transferNumber: form.transferNumber || undefined, voicemailMessage: form.voicemailMessage || undefined,
        endCallMessage: form.endCallMessage || undefined, maxTokens: form.maxTokens || undefined,
        transcriberConfig: { confidenceThreshold: form.transcriberConfig.confidenceThreshold, endUtteranceSilenceThreshold: form.transcriberConfig.endUtteranceSilenceThreshold,
          ...(form.transcriberConfig.wordBoost.length > 0 && { wordBoost: form.transcriberConfig.wordBoost }),
          ...(form.transcriberConfig.keytermsPrompt && { keytermsPrompt: form.transcriberConfig.keytermsPrompt }),
        },
        toolIds: form.toolIds,
      };
      if (form.analysisEnabled) {
        payload.analysisPlan = { ...(form.analysisSummaryPrompt && { summaryPrompt: form.analysisSummaryPrompt }), ...(form.analysisSuccessEvaluation && { successEvaluation: form.analysisSuccessEvaluation }) };
      }
      await api.patch(`/agents/${agent.id}`, payload);
      onUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));
  const filteredVoices = voiceOptions.filter((v) => v.provider === form.voiceProvider);
  // Voice providers that work without extra credentials: vapi, deepgram, openai, azure
  // Voice providers that require API keys: 11labs (most voices), cartesia, playht, rime-ai, lmnt, neets
  const voiceProviders = [
    { id: 'vapi', name: 'Vapi (built-in)' },
    { id: 'deepgram', name: 'Deepgram' },
    { id: 'openai', name: 'OpenAI' },
    { id: 'azure', name: 'Azure' },
    { id: '11labs', name: 'ElevenLabs' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900">Edit Agent</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Agent Name</label><input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Opening Message</label><input type="text" value={form.firstMessage} onChange={(e) => update('firstMessage', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Agent Instructions</label><textarea value={form.systemPrompt} onChange={(e) => update('systemPrompt', e.target.value)} rows={5} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none resize-none font-mono text-sm" required /></div>
          
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Volume2 className="w-4 h-4" /> Voice</div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-gray-500 mb-1">Provider</label><select value={form.voiceProvider} onChange={(e) => { const newProvider = e.target.value; const first = voiceOptions.find((v) => v.provider === newProvider); update('voiceProvider', newProvider); update('voiceId', first?.voiceId || ''); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{voiceProviders.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}</select></div>
              <div><label className="block text-xs text-gray-500 mb-1">Voice</label><select value={form.voiceId} onChange={(e) => update('voiceId', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">{filteredVoices.map((v) => (<option key={v.voiceId} value={v.voiceId}>{v.name} ({v.gender}, {v.accent})</option>))}</select></div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Brain className="w-4 h-4" /> AI Model</div>
            <div className="grid grid-cols-1 gap-2">{modelOptions.map((m) => (<label key={`${m.provider}/${m.model}`} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${form.modelProvider === m.provider && form.modelName === m.model ? 'border-brand-500 bg-brand-50/50' : 'border-gray-200 hover:border-gray-300'}`}><input type="radio" name="model" checked={form.modelProvider === m.provider && form.modelName === m.model} onChange={() => { update('modelProvider', m.provider); update('modelName', m.model); }} className="accent-brand-600" /><div><span className="text-sm font-medium text-gray-900">{m.name}</span><span className="text-xs text-gray-400 ml-2">{m.description}</span></div></label>))}</div>
          </div>

          {orgTools.length > 0 && (
            <div className="bg-purple-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Wrench className="w-4 h-4 text-purple-600" /> Tools</div>
              <div className="space-y-2">{orgTools.map((tool) => (<label key={tool.id} className="flex items-start gap-3 p-3 bg-white border border-purple-100 rounded-lg cursor-pointer hover:bg-purple-50/50"><input type="checkbox" checked={form.toolIds.includes(tool.id)} onChange={(e) => update('toolIds', e.target.checked ? [...form.toolIds, tool.id] : form.toolIds.filter((id) => id !== tool.id))} className="accent-brand-600 w-4 h-4 mt-0.5" /><div><div className="flex items-center gap-2"><span className="text-sm font-medium text-gray-900">{tool.name}</span><span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tool.type}</span></div><p className="text-xs text-gray-500 mt-0.5">{tool.description}</p></div></label>))}</div>
            </div>
          )}

          <div className="bg-amber-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Sparkles className="w-4 h-4 text-amber-600" /> Post-Call Analysis</div>
            <label className="flex items-center gap-3 cursor-pointer bg-white p-3 rounded-lg border border-amber-100"><input type="checkbox" checked={form.analysisEnabled} onChange={(e) => update('analysisEnabled', e.target.checked)} className="accent-brand-600 w-4 h-4" /><span className="text-sm text-gray-700">Enable AI analysis</span></label>
            {form.analysisEnabled && (
              <div className="space-y-3 pl-7">
                <div><label className="block text-xs text-gray-500 mb-1">Summary Prompt</label><textarea value={form.analysisSummaryPrompt} onChange={(e) => update('analysisSummaryPrompt', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Success Evaluation</label><textarea value={form.analysisSuccessEvaluation} onChange={(e) => update('analysisSuccessEvaluation', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" /></div>
              </div>
            )}
          </div>

          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} /> Advanced</button>

          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-gray-500 mb-1">Max Duration</label><input type="number" value={form.maxDurationSeconds} onChange={(e) => update('maxDurationSeconds', parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Silence Timeout</label><input type="number" value={form.silenceTimeoutSeconds} onChange={(e) => update('silenceTimeoutSeconds', parseInt(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.endCallFunctionEnabled} onChange={(e) => update('endCallFunctionEnabled', e.target.checked)} className="accent-brand-600 w-4 h-4" /><span className="text-sm text-gray-700">Allow AI to end call</span></label>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Test Call Modal
// ============================================================
function TestCallModal({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleCall = async () => {
    if (!phoneNumber) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/agents/${agent.id}/test-call`, { phoneNumber });
      setResult(res.data);
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
          <h2 className="text-lg font-semibold text-gray-900">Test Call — {agent.name}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
          {result ? (
            <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3">
              <p className="font-medium">Call initiated!</p>
              <p className="mt-1">Call ID: {result.call?.id}</p>
              <p>Status: {result.call?.status}</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number to Call</label>
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1234567890" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                <p className="text-xs text-gray-400 mt-1">Include country code (e.g., +1 for US)</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-700">⚠️ This will make a real phone call. Make sure you have a phone number provisioned.</div>
            </>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">{result ? 'Close' : 'Cancel'}</button>
            {!result && (
              <button onClick={handleCall} disabled={loading || !phoneNumber} className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" />{loading ? 'Calling...' : 'Make Call'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
