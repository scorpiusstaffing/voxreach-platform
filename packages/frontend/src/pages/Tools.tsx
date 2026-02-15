import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Plus, ArrowLeft, Pencil, Trash2, X, Bot, Zap, Phone, Power, Code, Webhook } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  type: 'function' | 'transfer' | 'endCall';
  parameters?: Record<string, any>;
  apiEndpoint?: string;
  apiMethod?: string;
  transferNumber?: string;
  transferMessage?: string;
  createdAt: string;
  agents?: { id: string; name: string }[];
}

const toolTypeIcons = {
  function: Code,
  transfer: Phone,
  endCall: Power,
};

const toolTypeLabels = {
  function: 'API Request',
  transfer: 'Transfer Call',
  endCall: 'End Call',
};

export default function Tools() {
  const { user, loading: authLoading } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTool, setEditTool] = useState<Tool | null>(null);

  useEffect(() => {
    if (user) loadTools();
  }, [user]);

  const loadTools = () => {
    setLoading(true);
    api.get('/tools')
      .then((res) => setTools(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const deleteTool = async (id: string) => {
    if (!confirm('Delete this tool? It will be removed from all agents using it.')) return;
    try {
      await api.delete(`/tools/${id}`);
      setTools((t) => t.filter((x) => x.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 ml-64 p-8">
      <div className="max-w-5xl">
        <Link to="/dashboard" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Tools</h1>
            <p className="text-gray-500 mt-1">Create reusable tools for your agents to use during calls</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Tool
          </button>
        </div>

        {/* Tool Types Info */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Code className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">API Request</h3>
                <p className="text-xs text-gray-500">Call external APIs</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Connect to CRMs, calendars, databases, or any HTTP endpoint</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Transfer Call</h3>
                <p className="text-xs text-gray-500">Transfer to human</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Seamlessly transfer calls to phone numbers or departments</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-50 rounded-lg">
                <Power className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">End Call</h3>
                <p className="text-xs text-gray-500">Terminate call</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Programmatically end calls when conditions are met</p>
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
        ) : tools.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Webhook className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tools yet</h3>
            <p className="text-gray-500 mb-6">Create your first tool to give your agents superpowers.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-brand-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-700"
            >
              Create Tool
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tools.map((tool) => {
              const Icon = toolTypeIcons[tool.type] || Bot;
              return (
                <div key={tool.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <Icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {toolTypeLabels[tool.type]}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-3">{tool.description}</p>
                      
                      {tool.type === 'function' && tool.apiEndpoint && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <span className="text-gray-400">Endpoint:</span>
                          <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">{tool.apiMethod || 'POST'} {tool.apiEndpoint}</code>
                        </div>
                      )}
                      
                      {tool.type === 'transfer' && tool.transferNumber && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <span className="text-gray-400">Transfer to:</span>
                          <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">{tool.transferNumber}</code>
                        </div>
                      )}

                      {tool.agents && tool.agents.length > 0 && (
                        <div className="mt-3 text-sm text-gray-500">
                          Used by: {tool.agents.map((a) => a.name).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5 ml-4">
                      <button
                        onClick={() => setEditTool(tool)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTool(tool.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showCreate && (
          <CreateToolModal
            onClose={() => setShowCreate(false)}
            onCreated={() => { setShowCreate(false); loadTools(); }}
          />
        )}

        {editTool && (
          <EditToolModal
            tool={editTool}
            onClose={() => setEditTool(null)}
            onUpdated={() => { setEditTool(null); loadTools(); }}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================
// Create Tool Modal
// ============================================================
function CreateToolModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [type, setType] = useState<'function' | 'transfer' | 'endCall'>('function');
  const [form, setForm] = useState({
    name: '',
    description: '',
    // API Request fields
    apiEndpoint: '',
    apiMethod: 'POST',
    apiHeaders: '{}',
    // Transfer fields
    transferNumber: '',
    transferMessage: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let payload: any = {
        name: form.name,
        description: form.description,
        type,
      };

      if (type === 'function') {
        payload.apiEndpoint = form.apiEndpoint;
        payload.apiMethod = form.apiMethod;
        try {
          payload.apiHeaders = JSON.parse(form.apiHeaders);
        } catch {
          payload.apiHeaders = {};
        }
      } else if (type === 'transfer') {
        payload.transferNumber = form.transferNumber;
        payload.transferMessage = form.transferMessage;
      }

      await api.post('/tools', payload);
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create tool');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Create Tool</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

          {/* Tool Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tool Type</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'function', icon: Code, label: 'API Request' },
                { id: 'transfer', icon: Phone, label: 'Transfer' },
                { id: 'endCall', icon: Power, label: 'End Call' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id as any)}
                  className={`flex flex-col items-center gap-2 p-4 border rounded-xl transition-colors ${
                    type === t.id
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <t.icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Common Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tool Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g., Book Meeting, Check CRM"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              placeholder="Describe what this tool does. The AI will use this to decide when to use it."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none resize-none"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Be specific — this helps the AI understand when to use this tool</p>
          </div>

          {/* Type-Specific Fields */}
          {type === 'function' && (
            <div className="space-y-4 bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Webhook className="w-4 h-4" /> API Configuration
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Endpoint URL</label>
                <input
                  type="url"
                  value={form.apiEndpoint}
                  onChange={(e) => update('apiEndpoint', e.target.value)}
                  placeholder="https://api.example.com/book-meeting"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">HTTP Method</label>
                <select
                  value={form.apiMethod}
                  onChange={(e) => update('apiMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Headers (JSON)</label>
                <textarea
                  value={form.apiHeaders}
                  onChange={(e) => update('apiHeaders', e.target.value)}
                  rows={3}
                  placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none font-mono resize-none"
                />
              </div>
            </div>
          )}

          {type === 'transfer' && (
            <div className="space-y-4 bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Phone className="w-4 h-4" /> Transfer Configuration
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={form.transferNumber}
                  onChange={(e) => update('transferNumber', e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Transfer Message (optional)</label>
                <input
                  type="text"
                  value={form.transferMessage}
                  onChange={(e) => update('transferMessage', e.target.value)}
                  placeholder="Please hold while I transfer you..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>
          )}

          {type === 'endCall' && (
            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
              <p>This tool will allow the AI to end the call when it determines the conversation is complete or the user has indicated they want to end the call.</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Tool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Edit Tool Modal
// ============================================================
function EditToolModal({ tool, onClose, onUpdated }: { tool: Tool; onClose: () => void; onUpdated: () => void }) {
  const [form, setForm] = useState({
    name: tool.name,
    description: tool.description,
    apiEndpoint: tool.apiEndpoint || '',
    apiMethod: tool.apiMethod || 'POST',
    apiHeaders: JSON.stringify(tool.apiHeaders || {}, null, 2),
    transferNumber: tool.transferNumber || '',
    transferMessage: tool.transferMessage || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let payload: any = {
        name: form.name,
        description: form.description,
      };

      if (tool.type === 'function') {
        payload.apiEndpoint = form.apiEndpoint;
        payload.apiMethod = form.apiMethod;
        try {
          payload.apiHeaders = JSON.parse(form.apiHeaders);
        } catch {
          payload.apiHeaders = {};
        }
      } else if (tool.type === 'transfer') {
        payload.transferNumber = form.transferNumber;
        payload.transferMessage = form.transferMessage;
      }

      await api.patch(`/tools/${tool.id}`, payload);
      onUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update tool');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));
  const Icon = toolTypeIcons[tool.type] || Bot;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <Icon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Edit Tool</h2>
              <span className="text-xs text-gray-500">{toolTypeLabels[tool.type]}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tool Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none resize-none"
              required
            />
          </div>

          {tool.type === 'function' && (
            <div className="space-y-4 bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Webhook className="w-4 h-4" /> API Configuration
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Endpoint URL</label>
                <input
                  type="url"
                  value={form.apiEndpoint}
                  onChange={(e) => update('apiEndpoint', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">HTTP Method</label>
                <select
                  value={form.apiMethod}
                  onChange={(e) => update('apiMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Headers (JSON)</label>
                <textarea
                  value={form.apiHeaders}
                  onChange={(e) => update('apiHeaders', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none font-mono resize-none"
                />
              </div>
            </div>
          )}

          {tool.type === 'transfer' && (
            <div className="space-y-4 bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Phone className="w-4 h-4" /> Transfer Configuration
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={form.transferNumber}
                  onChange={(e) => update('transferNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Transfer Message (optional)</label>
                <input
                  type="text"
                  value={form.transferMessage}
                  onChange={(e) => update('transferMessage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
