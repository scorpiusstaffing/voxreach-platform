import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Plus, ArrowLeft, Trash2, Edit, Wrench, FileText, Phone, Webhook, X, Code, Globe } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  description: string;
  type: 'api' | 'function' | 'transfer';
  parameters: any;
  apiEndpoint?: string;
  apiMethod?: string;
  apiHeaders?: any;
  transferNumber?: string;
  transferMessage?: string;
  agents: { id: string; name: string }[];
  createdAt: string;
}

export default function Tools() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTool, setEditTool] = useState<Tool | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading]);

  useEffect(() => {
    loadTools();
  }, [user]);

  const loadTools = () => {
    if (user) {
      api.get('/tools')
        .then((res) => setTools(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  const deleteTool = async (id: string) => {
    try {
      await api.delete(`/tools/${id}`);
      setTools((t) => t.filter((x) => x.id !== id));
      setDeleteConfirm(null);
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
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Tools</h1>
            <p className="text-gray-500 mt-1">Create tools your agents can use during calls</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Tool
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
        ) : tools.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tools yet</h3>
            <p className="text-gray-500 mb-6">Create tools that your agents can use during calls, like API calls or transfers.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-brand-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-700"
            >
              Create First Tool
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tools.map((tool) => (
              <div key={tool.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${tool.type === 'api' ? 'bg-blue-50 text-blue-600' : tool.type === 'transfer' ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'}`}>
                        {tool.type === 'api' ? <Globe className="w-5 h-5" /> : tool.type === 'transfer' ? <Phone className="w-5 h-5" /> : <Code className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{tool.type}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{tool.description}</p>
                    
                    {tool.type === 'api' && tool.apiEndpoint && (
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                        <Webhook className="w-3.5 h-3.5" />
                        {tool.apiMethod} {tool.apiEndpoint}
                      </div>
                    )}
                    
                    {tool.type === 'transfer' && tool.transferNumber && (
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                        <Phone className="w-3.5 h-3.5" />
                        {tool.transferNumber}
                      </div>
                    )}

                    {tool.agents.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-gray-400">Used by:</span>
                        <div className="flex gap-1">
                          {tool.agents.map((agent) => (
                            <span key={agent.id} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{agent.name}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5 ml-4">
                    <button
                      onClick={() => setEditTool(tool)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(tool.id)}
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

        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
            <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Tool?</h3>
              <p className="text-sm text-gray-500 mb-6">This will remove the tool from all agents that use it. This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={() => deleteTool(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Create Tool Modal
// ============================================================
function CreateToolModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [type, setType] = useState<'api' | 'transfer'>('api');
  const [form, setForm] = useState({
    name: '',
    description: '',
    // API fields
    apiEndpoint: '',
    apiMethod: 'POST',
    apiHeaders: '{}',
    // Transfer fields
    transferNumber: '',
    transferMessage: 'Please hold while we transfer your call.',
    // Parameters
    parameters: JSON.stringify({
      type: 'object',
      properties: {},
      required: []
    }, null, 2),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: any = {
        name: form.name,
        description: form.description,
        type,
        parameters: JSON.parse(form.parameters),
      };

      if (type === 'api') {
        payload.apiEndpoint = form.apiEndpoint;
        payload.apiMethod = form.apiMethod;
        payload.apiHeaders = JSON.parse(form.apiHeaders || '{}');
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
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900">Create Tool</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

          {/* Tool Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tool Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('api')}
                className={`p-4 border rounded-xl text-left transition-colors ${type === 'api' ? 'border-brand-500 bg-brand-50/50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <Globe className="w-5 h-5 text-blue-500 mb-2" />
                <div className="font-medium text-sm text-gray-900">API Request</div>
                <div className="text-xs text-gray-500">Call external APIs during calls</div>
              </button>
              <button
                type="button"
                onClick={() => setType('transfer')}
                className={`p-4 border rounded-xl text-left transition-colors ${type === 'transfer' ? 'border-brand-500 bg-brand-50/50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <Phone className="w-5 h-5 text-green-500 mb-2" />
                <div className="font-medium text-sm text-gray-900">Transfer Call</div>
                <div className="text-xs text-gray-500">Transfer to another number</div>
              </button>
            </div>
          </div>

          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tool Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g., book_appointment, lookup_customer"
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
              placeholder="Describe what this tool does. The AI will use this to know when to call it."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none resize-none"
              required
            />
          </div>

          {/* Type-specific fields */}
          {type === 'api' && (
            <div className="space-y-4 bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Globe className="w-4 h-4" /> API Configuration</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs text-gray-500 mb-1">Method</label>
                  <select
                    value={form.apiMethod}
                    onChange={(e) => update('apiMethod', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option>POST</option>
                    <option>GET</option>
                    <option>PUT</option>
                    <option>DELETE</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Endpoint URL</label>
                  <input
                    type="url"
                    value={form.apiEndpoint}
                    onChange={(e) => update('apiEndpoint', e.target.value)}
                    placeholder="https://api.example.com/endpoint"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required={type === 'api'}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Headers (JSON)</label>
                <textarea
                  value={form.apiHeaders}
                  onChange={(e) => update('apiHeaders', e.target.value)}
                  rows={3}
                  placeholder={`{"Authorization": "Bearer token", "Content-Type": "application/json"}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                />
              </div>
            </div>
          )}

          {type === 'transfer' && (
            <div className="space-y-4 bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Phone className="w-4 h-4" /> Transfer Configuration</div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Transfer Number</label>
                <input
                  type="tel"
                  value={form.transferNumber}
                  onChange={(e) => update('transferNumber', e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required={type === 'transfer'}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Transfer Message</label>
                <input
                  type="text"
                  value={form.transferMessage}
                  onChange={(e) => update('transferMessage', e.target.value)}
                  placeholder="Please hold while we transfer your call."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          )}

          {/* Parameters Schema */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Code className="w-4 h-4" /> Parameters Schema (JSON)</div>
            <textarea
              value={form.parameters}
              onChange={(e) => update('parameters', e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
            />
            <p className="text-xs text-gray-500">Define the parameters the AI should collect before calling this tool.</p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50">{loading ? 'Creating...' : 'Create Tool'}</button>
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
    parameters: JSON.stringify(tool.parameters || {}, null, 2),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: any = {
        name: form.name,
        description: form.description,
        parameters: JSON.parse(form.parameters),
      };

      if (tool.type === 'api') {
        payload.apiEndpoint = form.apiEndpoint;
        payload.apiMethod = form.apiMethod;
        payload.apiHeaders = JSON.parse(form.apiHeaders || '{}');
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white p-6 border-b border-gray-100 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900">Edit Tool</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tool Name</label>
            <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none resize-none" required />
          </div>

          {tool.type === 'api' && (
            <div className="space-y-4 bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Globe className="w-4 h-4" /> API Configuration</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs text-gray-500 mb-1">Method</label>
                  <select value={form.apiMethod} onChange={(e) => update('apiMethod', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>POST</option><option>GET</option><option>PUT</option><option>DELETE</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Endpoint URL</label>
                  <input type="url" value={form.apiEndpoint} onChange={(e) => update('apiEndpoint', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Headers (JSON)</label>
                <textarea value={form.apiHeaders} onChange={(e) => update('apiHeaders', e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" />
              </div>
            </div>
          )}

          {tool.type === 'transfer' && (
            <div className="space-y-4 bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Phone className="w-4 h-4" /> Transfer Configuration</div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Transfer Number</label>
                <input type="tel" value={form.transferNumber} onChange={(e) => update('transferNumber', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Transfer Message</label>
                <input type="text" value={form.transferMessage} onChange={(e) => update('transferMessage', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Code className="w-4 h-4" /> Parameters Schema (JSON)</div>
            <textarea value={form.parameters} onChange={(e) => update('parameters', e.target.value)} rows={6} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}