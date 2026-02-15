// ============================================================
// Edit Agent Modal
// ============================================================
function EditAgentModal({ agent, onClose, onUpdated }: { agent: Agent; onClose: () => void; onUpdated: () => void }) {
  const config = agent.vapiConfig || {};
  const [form, setForm] = useState({
    name: agent.name,
    systemPrompt: agent.systemPrompt,
    firstMessage: agent.firstMessage,
    voiceProvider: agent.voiceProvider,
    voiceId: agent.voiceId,
    voiceSpeed: config.voiceSpeed ?? 1.0,
    modelProvider: config.modelProvider || 'openai',
    modelName: config.modelName || 'gpt-4o',
    temperature: config.temperature ?? 0.7,
    maxTokens: config.maxTokens,
    language: agent.language,
    transferNumber: agent.transferNumber || '',
    maxDurationSeconds: config.maxDurationSeconds || (agent.direction === 'outbound' ? 300 : 600),
    backgroundSound: config.backgroundSound || (agent.direction === 'outbound' ? 'office' : 'off'),
    firstMessageMode: config.firstMessageMode || 'assistant-speaks-first',
    voicemailDetection: config.voicemailDetection ?? (agent.direction === 'outbound'),
    voicemailMessage: config.voicemailMessage || '',
    endCallMessage: config.endCallMessage || '',
    silenceTimeoutSeconds: config.silenceTimeoutSeconds || 30,
    endCallFunctionEnabled: config.endCallFunctionEnabled ?? false,
    firstMessageInterruptionsEnabled: config.firstMessageInterruptionsEnabled ?? false,
    recordingEnabled: config.recordingEnabled ?? true,
    transcriberProvider: config.transcriberProvider || 'deepgram',
    transcriberModel: config.transcriberModel || 'nova-3',
    transcriberConfig: {
      confidenceThreshold: config.transcriberConfig?.confidenceThreshold ?? 0.4,
      wordBoost: config.transcriberConfig?.wordBoost || [],
      keytermsPrompt: config.transcriberConfig?.keytermsPrompt || '',
      endUtteranceSilenceThreshold: config.transcriberConfig?.endUtteranceSilenceThreshold ?? 700,
    },
    toolIds: agent.tools?.map(t => t.id) || [],
    analysisEnabled: !!config.analysisPlan,
    analysisSummaryPrompt: config.analysisPlan?.summaryPrompt || '',
    analysisSuccessEvaluation: config.analysisPlan?.successEvaluation || '',
  });
  const [voiceOptions, setVoiceOptions] = useState<VoiceOption[]>([]);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [orgTools, setOrgTools] = useState<Tool[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'voice' | 'tools' | 'analysis'>('basic');
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
      const payload: any = {
        name: form.name,
        systemPrompt: form.systemPrompt,
        firstMessage: form.firstMessage,
        voiceProvider: form.voiceProvider,
        voiceId: form.voiceId,
        voiceSpeed: form.voiceSpeed,
        modelProvider: form.modelProvider,
        modelName: form.modelName,
        temperature: form.temperature,
        maxTokens: form.maxTokens,
        language: form.language,
        transferNumber: form.transferNumber || undefined,
        maxDurationSeconds: form.maxDurationSeconds,
        backgroundSound: form.backgroundSound,
        firstMessageMode: form.firstMessageMode,
        voicemailDetection: form.voicemailDetection,
        voicemailMessage: form.voicemailMessage || undefined,
        endCallMessage: form.endCallMessage || undefined,
        silenceTimeoutSeconds: form.silenceTimeoutSeconds,
        endCallFunctionEnabled: form.endCallFunctionEnabled,
        firstMessageInterruptionsEnabled: form.firstMessageInterruptionsEnabled,
        recordingEnabled: form.recordingEnabled,
        transcriberProvider: form.transcriberProvider,
        transcriberModel: form.transcriberModel,
        transcriberConfig: {
          confidenceThreshold: form.transcriberConfig.confidenceThreshold,
          ...(form.transcriberConfig.wordBoost.length > 0 && { wordBoost: form.transcriberConfig.wordBoost }),
          ...(form.transcriberConfig.keytermsPrompt && { keytermsPrompt: form.transcriberConfig.keytermsPrompt }),
          endUtteranceSilenceThreshold: form.transcriberConfig.endUtteranceSilenceThreshold,
        },
        toolIds: form.toolIds,
      };

      if (form.analysisEnabled) {
        payload.analysisPlan = {
          ...(form.analysisSummaryPrompt && { summaryPrompt: form.analysisSummaryPrompt }),
          ...(form.analysisSuccessEvaluation && { successEvaluation: form.analysisSuccessEvaluation }),
        };
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
    <button type="button" onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === id ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900">Edit Agent</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-[calc(90vh-140px)]">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 m-6 mb-0">{error}</div>}

          <div className="px-6 pt-4 border-b border-gray-100">
            <div className="flex gap-2">
              <TabButton id="basic" label="Basic" icon={Bot} />
              <TabButton id="voice" label="Voice & AI" icon={Volume2} />
              <TabButton id="tools" label="Tools" icon={Wrench} />
              <TabButton id="analysis" label="Analysis" icon={Sparkles} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'basic' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Agent Name</label>
                  <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Opening Message</label>
                  <input type="text" value={form.firstMessage} onChange={(e) => update('firstMessage', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Agent Instructions</label>
                  <textarea value={form.systemPrompt} onChange={(e) => update('systemPrompt', e.target.value)} rows={6} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none resize-none font-mono text-sm" required />
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
                    <textarea value={form.voicemailMessage} onChange={(e) => update('voicemailMessage', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
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
                      <select value={form.voiceProvider} onChange={(e) => { update('voiceProvider', e.target.value); const first = voiceOptions.find((v) => v.provider === e.target.value); if (first) update('voiceId', first.voiceId); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
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
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-2">Advanced Settings</p>
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
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tools' && (
              <div className="space-y-5">
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Wrench className="w-4 h-4" /> Tools</div>
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
                        <label className="block text-xs text-gray-500 mb-1">Summary Prompt</label>
                        <textarea value={form.analysisSummaryPrompt} onChange={(e) => update('analysisSummaryPrompt', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Success Evaluation</label>
                        <textarea value={form.analysisSuccessEvaluation} onChange={(e) => update('analysisSuccessEvaluation', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-100 flex gap-3">
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
              <div className="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-700">
                ⚠️ This will make a real phone call. Make sure you have a phone number provisioned.
              </div>
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