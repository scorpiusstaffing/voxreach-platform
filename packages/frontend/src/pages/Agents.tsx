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
      <Link to="/dashboard" className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-white mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-white">Agents</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 btn-cyan px-5 py-2.5"
        >
          <Plus className="w-4 h-4" /> Create Agent
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
      ) : agents.length === 0 ? (
        <div className="bg-[#161B22] rounded-xl border border-[#21262D] p-12 text-center">
          <Bot className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No agents yet</h3>
          <p className="text-[#9CA3AF] mb-6">Create your first AI voice agent to start making or receiving calls.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-cyan px-6 py-2.5"
          >
            Create Agent
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-[#161B22] rounded-xl border border-[#21262D] p-6 card-glow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-white">{agent.name}</h3>
                    <button
                      onClick={() => toggleActive(agent)}
                      className={`text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                        agent.isActive ? 'badge-success-dark' : 'badge-neutral-dark'
                      }`}
                    >
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {agent.direction}
                    </span>
                    {agent.tools && agent.tools.length > 0 && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                        <Wrench className="w-3 h-3" /> {agent.tools.length} tool{agent.tools.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#9CA3AF] mt-2">
                    <span className="flex items-center gap-1"><Volume2 className="w-3.5 h-3.5" /> {agent.voiceProvider}/{agent.voiceId}</span>
                    <span className="flex items-center gap-1"><Mic className="w-3.5 h-3.5" /> {agent.language}</span>
                  </div>
                  {agent.phoneNumbers.length > 0 && (
                    <div className="flex items-center gap-1 text-sm text-[#6B7280] mt-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {agent.phoneNumbers.map((p) => p.friendlyName || p.number).join(', ')}
                    </div>
                  )}
                  <p className="text-sm text-[#6B7280] mt-2 line-clamp-2">{agent.systemPrompt.substring(0, 120)}...</p>
                </div>
                <div className="flex gap-1.5 ml-4">
                  {agent.direction === 'outbound' && (
                    <button
                      onClick={() => setTestCallAgent(agent)}
                      className="p-2 text-[#6B7280] hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                      title="Test call"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setEditAgent(agent)}
                    className="p-2 text-[#6B7280] hover:text-white hover:bg-[#21262D] rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteAgent(agent.id)}
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
    setError('');
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
  const voiceProviders = [
    { id: 'vapi', name: 'Vapi (built-in)' },
    { id: 'deepgram', name: 'Deepgram' },
    { id: 'openai', name: 'OpenAI' },
    { id: 'azure', name: 'Azure' },
    { id: '11labs', name: 'ElevenLabs' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="modal-dark w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#0D1117] p-6 border-b border-[#21262D] flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-white">{step === 'template' ? 'Choose a Template' : 'Configure Agent'}</h2>
          <button onClick={onClose} className="p-2 text-[#6B7280] hover:text-white rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>
        {step === 'template' ? (
          <div className="p-6 space-y-3">
            {templates.filter((t) => t.direction === intent || intent === 'both').map((t) => (
              <button key={t.id} onClick={() => applyTemplate(t)} className="w-full text-left p-4 border border-[#21262D] rounded-xl hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all">
                <div className="flex items-center gap-2 mb-1"><Zap className="w-4 h-4 text-cyan-400" /><span className="font-medium text-white">{t.name}</span><span className="text-xs bg-[#161B22] text-[#9CA3AF] px-2 py-0.5 rounded-full border border-[#21262D]">{t.direction}</span></div>
                <p className="text-sm text-[#6B7280] line-clamp-2">{t.systemPrompt.substring(0, 150)}...</p>
              </button>
            ))}
            <button onClick={() => setStep('configure')} className="w-full text-left p-4 border-2 border-dashed border-[#21262D] rounded-xl hover:border-[#6B7280] transition-colors">
              <div className="flex items-center gap-2 mb-1"><Plus className="w-4 h-4 text-[#6B7280]" /><span className="font-medium text-[#E5E7EB]">Build from scratch</span></div>
              <p className="text-sm text-[#6B7280]">Create a custom agent with your own instructions</p>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && <div className="bg-red-500/10 text-red-400 text-sm rounded-lg px-4 py-3 border border-red-500/20">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-[#E5E7EB] mb-1.5">Agent Name</label>
              <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g., Sales Agent" className="w-full px-4 py-2.5 dark-input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#E5E7EB] mb-1.5">Opening Message</label>
              <input type="text" value={form.firstMessage} onChange={(e) => update('firstMessage', e.target.value)} placeholder="Hi, this is Sarah from..." className="w-full px-4 py-2.5 dark-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#E5E7EB] mb-1.5">Agent Instructions</label>
              <textarea value={form.systemPrompt} onChange={(e) => update('systemPrompt', e.target.value)} rows={5} className="w-full px-4 py-2.5 dark-input resize-none font-mono text-sm" placeholder="You are a professional sales representative..." required />
            </div>
            
            <div className="bg-[#161B22] rounded-xl p-4 space-y-4 border border-[#21262D]">
              <div className="flex items-center gap-2 text-sm font-medium text-[#E5E7EB]"><Volume2 className="w-4 h-4 text-cyan-400" /> Voice</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#6B7280] mb-1">Provider</label>
                  <select value={form.voiceProvider} onChange={(e) => { const newProvider = e.target.value; const first = voiceOptions.find((v) => v.provider === newProvider); update('voiceProvider', newProvider); update('voiceId', first?.voiceId || ''); }} className="w-full px-3 py-2 dark-input text-sm">
                    {voiceProviders.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#6B7280] mb-1">Voice</label>
                  <select value={form.voiceId} onChange={(e) => update('voiceId', e.target.value)} className="w-full px-3 py-2 dark-input text-sm">
                    {filteredVoices.map((v) => (<option key={v.voiceId} value={v.voiceId}>{v.name} ({v.gender}, {v.accent})</option>))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-[#161B22] rounded-xl p-4 space-y-3 border border-[#21262D]">
              <div className="flex items-center gap-2 text-sm font-medium text-[#E5E7EB]"><Brain className="w-4 h-4 text-cyan-400" /> AI Model</div>
              <div className="grid grid-cols-1 gap-2">
                {modelOptions.map((m) => (
                  <label key={`${m.provider}/${m.model}`} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${form.modelProvider === m.provider && form.modelName === m.model ? 'border-cyan-500 bg-cyan-500/10' : 'border-[#21262D] hover:border-[#6B7280]'}`}>
                    <input type="radio" name="model" checked={form.modelProvider === m.provider && form.modelName === m.model} onChange={() => { update('modelProvider', m.provider); update('modelName', m.model); }} className="accent-cyan-500" />
                    <div><span className="text-sm font-medium text-white">{m.name}</span><span className="text-xs text-[#6B7280] ml-2">{m.description}</span></div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#E5E7EB] mb-1.5">Language</label>
                <select value={form.language} onChange={(e) => update('language', e.target.value)} className="w-full px-4 py-2.5 dark-input">
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#E5E7EB] mb-1.5">Transfer Number</label>
                <input type="tel" value={form.transferNumber} onChange={(e) => update('transferNumber', e.target.value)} placeholder="+1234567890" className="w-full px-4 py-2.5 dark-input" />
              </div>
            </div>

            {orgTools.length > 0 && (
              <div className="bg-purple-500/5 rounded-xl p-4 space-y-3 border border-purple-500/20">
                <div className="flex items-center gap-2 text-sm font-medium text-[#E5E7EB]"><Wrench className="w-4 h-4 text-purple-400" /> Tools</div>
                <div className="space-y-2">
                  {orgTools.map((tool) => (
                    <label key={tool.id} className="flex items-start gap-3 p-3 bg-[#0D1117] border border-purple-500/20 rounded-lg cursor-pointer hover:bg-purple-500/5">
                      <input type="checkbox" checked={form.toolIds.includes(tool.id)} onChange={(e) => update('toolIds', e.target.checked ? [...form.toolIds, tool.id] : form.toolIds.filter((id) => id !== tool.id))} className="accent-cyan-500 w-4 h-4 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{tool.name}</span>
                          <span className="text-xs bg-[#161B22] text-[#9CA3AF] px-2 py-0.5 rounded-full border border-[#21262D]">{tool.type}</span>
                        </div>
                        <p className="text-xs text-[#6B7280] mt-0.5">{tool.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-amber-500/5 rounded-xl p-4 space-y-3 border border-amber-500/20">
              <div className="flex items-center gap-2 text-sm font-medium text-[#E5E7EB]"><Sparkles className="w-4 h-4 text-amber-400" /> Post-Call Analysis</div>
              <label className="flex items-center gap-3 cursor-pointer bg-[#0D1117] p-3 rounded-lg border border-[#21262D]">
                <input type="checkbox" checked={form.analysisEnabled} onChange={(e) => update('analysisEnabled', e.target.checked)} className="accent-cyan-500 w-4 h-4" />
                <span className="text-sm text-[#E5E7EB]">Enable AI analysis after each call</span>
              </label>
              {form.analysisEnabled && (
                <div className="space-y-3 pl-7">
                  <div>
                    <label className="block text-xs text-[#6B7280] mb-1">Summary Prompt</label>
                    <textarea value={form.analysisSummaryPrompt} onChange={(e) => update('analysisSummaryPrompt', e.target.value)} rows={2} placeholder="Summarize the call focusing on..." className="w-full px-3 py-2 dark-input text-sm resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6B7280] mb-1">Success Evaluation</label>
                    <textarea value={form.analysisSuccessEvaluation} onChange={(e) => update('analysisSuccessEvaluation', e.target.value)} rows={2} placeholder="The call was successful if..." className="w-full px-3 py-2 dark-input text-sm resize-none" />
                  </div>
                </div>
              )}
            </div>

            <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#E5E7EB] transition-colors">
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} /> Advanced Settings
            </button>

            {showAdvanced && (
              <div className="space-y-4 pt-2 border-t border-[#21262D]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#6B7280] mb-1">Max Duration (sec)</label>
                    <input type="number" value={form.maxDurationSeconds} onChange={(e) => update('maxDurationSeconds', parseInt(e.target.value))} className="w-full px-3 py-2 dark-input text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6B7280] mb-1">Silence Timeout (sec)</label>
                    <input type="number" value={form.silenceTimeoutSeconds} onChange={(e) => update('silenceTimeoutSeconds', parseInt(e.target.value))} className="w-full px-3 py-2 dark-input text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#6B7280] mb-1">Background Sound</label>
                    <select value={form.backgroundSound} onChange={(e) => update('backgroundSound', e.target.value)} className="w-full px-3 py-2 dark-input text-sm">
                      <option value="off">None</option>
                      <option value="office">Office</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#6B7280] mb-1">Who Speaks First</label>
                    <select value={form.firstMessageMode} onChange={(e) => update('firstMessageMode', e.target.value)} className="w-full px-3 py-2 dark-input text-sm">
                      <option value="assistant-speaks-first">Agent speaks first</option>
                      <option value="assistant-waits-for-user">Wait for customer</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.voicemailDetection} onChange={(e) => update('voicemailDetection', e.target.checked)} className="accent-cyan-500 w-4 h-4" />
                  <span className="text-sm text-[#E5E7EB]">Detect voicemail</span>
                </label>
                {form.voicemailDetection && (
                  <div>
                    <label className="block text-xs text-[#6B7280] mb-1">Voicemail Message</label>
                    <textarea value={form.voicemailMessage} onChange={(e) => update('voicemailMessage', e.target.value)} rows={2} className="w-full px-3 py-2 dark-input text-sm resize-none" />
                  </div>
                )}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.endCallFunctionEnabled} onChange={(e) => update('endCallFunctionEnabled', e.target.checked)} className="accent-cyan-500 w-4 h-4" />
                  <span className="text-sm text-[#E5E7EB]">Allow AI to end call</span>
                </label>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { if (step === 'configure') { setError(''); setStep('template'); } else { onClose(); } }} className="flex-1 py-2.5 border border-[#21262D] rounded-lg font-medium text-[#E5E7EB] hover:bg-[#161B22] transition-colors">
                {step === 'configure' ? 'Back' : 'Cancel'}
              </button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 btn-cyan disabled:opacity-50">
                {loading ? 'Creating...' : 'Create Agent'}
              </button>
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
      await api.patch(`/agents/\${agent.id}`, payload);
      onUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));
  const filteredVoices = voiceOptions.filter((v) => v.provider === form.voiceProvider);
  const voiceProviders = [
    { id: 'vapi', name: 'Vapi (built-in)' },
    { id: 'deepgram', name: 'Deepgram' },
    { id: 'openai', name: 'OpenAI' },
    { id: 'azure', name: 'Azure' },
    { id: '11labs', name: 'ElevenLabs' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="modal-dark w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#0D1117] p-6 border-b border-[#21262D] flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-white">Edit Agent</h2>
          <button onClick={onClose} className="p-2 text-[#6B7280] hover:text-white rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-500/10 text-red-400 text-sm rounded-lg px-4 py-3 border border-red-500/20">{error}</div>}
          <div><label className="block text-sm font-medium text-[#E5E7EB] mb-1.5">Agent Name</label><input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} className="w-full px-4 py-2.5 dark-input" required /></div>
          <div><label className="block text-sm font-medium text-[#E5E7EB] mb-1.5">Opening Message</label><input type="text" value={form.firstMessage} onChange={(e) => update('firstMessage', e.target.value)} className="w-full px-4 py-2.5 dark-input" /></div>
          <div><label className="block text-sm font-medium text-[#E5E7EB] mb-1.5">Agent Instructions</label><textarea value={form.systemPrompt} onChange={(e) => update('systemPrompt', e.target.value)} rows={5} className="w-full px-4 py-2.5 dark-input resize-none font-mono text-sm" required /></div>
          
          <div className="bg-[#161B22] rounded-xl p-4 space-y-4 border border-[#21262D]">
            <div className="flex items-center gap-2 text-sm font-medium text-[#E5E7EB]"><Volume2 className="w-4 h-4 text-cyan-400" /> Voice</div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-[#6B7280] mb-1">Provider</label><select value={form.voiceProvider} onChange={(e) => { const newProvider = e.target.value; const first = voiceOptions.find((v) => v.provider === newProvider); update('voiceProvider', newProvider); update('voiceId', first?.voiceId || ''); }} className="w-full px-3 py-2 dark-input text-sm">{voiceProviders.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}</select></div>
              <div><label className="block text-xs text-[#6B7280] mb-1">Voice</label><select value={form.voiceId} onChange={(e) => update('voiceId', e.target.value)} className="w-full px-3 py-2 dark-input text-sm">{filteredVoices.map((v) => (<option key={v.voiceId} value={v.voiceId}>{v.name} ({v.gender}, {v.accent})</option>))}</select></div>
            </div>
          </div>

          <div className="bg-[#161B22] rounded-xl p-4 space-y-3 border border-[#21262D]">
            <div className="flex items-center gap-2 text-sm font-medium text-[#E5E7EB]"><Brain className="w-4 h-4 text-cyan-400" /> AI Model</div>
            <div className="grid grid-cols-1 gap-2">{modelOptions.map((m) => (<label key={`\${m.provider}/\${m.model}`} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors \${form.modelProvider === m.provider && form.modelName === m.model ? 'border-cyan-500 bg-cyan-500/10' : 'border-[#21262D] hover:border-[#6B7280]'}`}><input type="radio" name="model" checked={form.modelProvider === m.provider && form.modelName === m.model} onChange={() => { update('modelProvider', m.provider); update('modelName', m.model); }} className="accent-cyan-500" /><div><span className="text-sm font-medium text-white">{m.name}</span><span className="text-xs text-[#6B7280] ml-2">{m.description}</span></div></label>))}</div>
          </div>

          {orgTools.length > 0 && (
            <div className="bg-purple-500/5 rounded-xl p-4 space-y-3 border border-purple-500/20">
              <div className="flex items-center gap-2 text-sm font-medium text-[#E5E7EB]"><Wrench className="w-4 h-4 text-purple-400" /> Tools</div>
              <div className="space-y-2">{orgTools.map((tool) => (<label key={tool.id} className="flex items-start gap-3 p-3 bg-[#0D1117] border border-purple-500/20 rounded-lg cursor-pointer hover:bg-purple-500/5"><input type="checkbox" checked={form.toolIds.includes(tool.id)} onChange={(e) => update('toolIds', e.target.checked ? [...form.toolIds, tool.id] : form.toolIds.filter((id) => id !== tool.id))} className="accent-cyan-500 w-4 h-4 mt-0.5" /><div><div className="flex items-center gap-2"><span className="text-sm font-medium text-white">{tool.name}</span><span className="text-xs bg-[#161B22] text-[#9CA3AF] px-2 py-0.5 rounded-full border border-[#21262D]">{tool.type}</span></div><p className="text-xs text-[#6B7280] mt-0.5">{tool.description}</p></div></label>))}</div>
            </div>
          )}

          <div className="bg-amber-500/5 rounded-xl p-4 space-y-3 border border-amber-500/20">
            <div className="flex items-center gap-2 text-sm font-medium text-[#E5E7EB]"><Sparkles className="w-4 h-4 text-amber-400" /> Post-Call Analysis</div>
            <label className="flex items-center gap-3 cursor-pointer bg-[#0D1117] p-3 rounded-lg border border-[#21262D]"><input type="checkbox" checked={form.analysisEnabled} onChange={(e) => update('analysisEnabled', e.target.checked)} className="accent-cyan-500 w-4 h-4" /><span className="text-sm text-[#E5E7EB]">Enable AI analysis</span></label>
            {form.analysisEnabled && (
              <div className="space-y-3 pl-7">
                <div><label className="block text-xs text-[#6B7280] mb-1">Summary Prompt</label><textarea value={form.analysisSummaryPrompt} onChange={(e) => update('analysisSummaryPrompt', e.target.value)} rows={2} className="w-full px-3 py-2 dark-input text-sm resize-none" /></div>
                <div><label className="block text-xs text-[#6B7280] mb-1">Success Evaluation</label><textarea value={form.analysisSuccessEvaluation} onChange={(e) => update('analysisSuccessEvaluation', e.target.value)} rows={2} className="w-full px-3 py-2 dark-input text-sm resize-none" /></div>
              </div>
            )}
          </div>

          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#E5E7EB] transition-colors"><ChevronDown className={`w-4 h-4 transition-transform \${showAdvanced ? 'rotate-180' : ''}`} /> Advanced</button>

          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t border-[#21262D]">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-[#6B7280] mb-1">Max Duration</label><input type="number" value={form.maxDurationSeconds} onChange={(e) => update('maxDurationSeconds', parseInt(e.target.value))} className="w-full px-3 py-2 dark-input text-sm" /></div>
                <div><label className="block text-xs text-[#6B7280] mb-1">Silence Timeout</label><input type="number" value={form.silenceTimeoutSeconds} onChange={(e) => update('silenceTimeoutSeconds', parseInt(e.target.value))} className="w-full px-3 py-2 dark-input text-sm" /></div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.endCallFunctionEnabled} onChange={(e) => update('endCallFunctionEnabled', e.target.checked)} className="accent-cyan-500 w-4 h-4" /><span className="text-sm text-[#E5E7EB]">Allow AI to end call</span></label>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-[#21262D] rounded-lg font-medium text-[#E5E7EB] hover:bg-[#161B22] transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 btn-cyan disabled:opacity-50">{loading ? 'Saving...' : 'Save Changes'}</button>
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
      const res = await api.post(`/agents/\${agent.id}/test-call`, { phoneNumber });
      setResult(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="modal-dark w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-[#21262D] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Test Call — {agent.name}</h2>
          <button onClick={onClose} className="p-2 text-[#6B7280] hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="bg-red-500/10 text-red-400 text-sm rounded-lg px-4 py-3 border border-red-500/20">{error}</div>}
          {result ? (
            <div className="bg-green-500/10 text-green-400 text-sm rounded-lg px-4 py-3 border border-green-500/20">
              <p className="font-medium">Call initiated!</p>
              <p className="mt-1">Call ID: {result.call?.id}</p>
              <p>Status: {result.call?.status}</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-[#E5E7EB] mb-1.5">Phone Number to Call</label>
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1234567890" className="w-full px-4 py-2.5 dark-input" />
                <p className="text-xs text-[#6B7280] mt-1">Include country code (e.g., +1 for US)</p>
              </div>
              <div className="bg-yellow-500/10 rounded-lg p-3 text-sm text-yellow-400 border border-yellow-500/20">⚠️ This will make a real phone call. Make sure you have a phone number provisioned.</div>
            </>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-[#21262D] rounded-lg font-medium text-[#E5E7EB] hover:bg-[#161B22] transition-colors">{result ? 'Close' : 'Cancel'}</button>
            {!result && (
              <button onClick={handleCall} disabled={loading || !phoneNumber} className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                <Phone className="w-4 h-4" />{loading ? 'Calling...' : 'Make Call'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
