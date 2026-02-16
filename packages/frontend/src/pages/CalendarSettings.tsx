import { useState, useEffect } from 'react';
import { Calendar, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

interface CalcomCredential {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  config: {
    username?: string;
    apiKey?: string;
    eventTypeId?: string;
    timeZone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface EventType {
  id: number;
  title: string;
  slug: string;
  length: number;
  userId: number;
}

export default function CalendarSettings() {
  const { organization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [credential, setCredential] = useState<CalcomCredential | null>(null);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [formData, setFormData] = useState({
    apiKey: '',
    username: '',
    eventTypeId: '',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const response = await api.get('/calendar/credentials');
      if (response.data.success && response.data.data) {
        setCredential(response.data.data);
        setFormData({
          apiKey: '',
          username: response.data.data.config.username || '',
          eventTypeId: response.data.data.config.eventTypeId || '',
          timeZone: response.data.data.config.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        
        // Load event types if credentials exist
        if (response.data.data.config.username) {
          loadEventTypes(response.data.data.config.username);
        }
      }
    } catch (err: any) {
      console.error('Failed to load credentials:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEventTypes = async (username: string) => {
    try {
      const response = await api.get('/calendar/event-types');
      if (response.data.success) {
        setEventTypes(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load event types:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const response = await api.post('/calendar/credentials', formData);
      if (response.data.success) {
        setSuccess('Calendar connected successfully!');
        setCredential(response.data.data);
        setFormData(prev => ({ ...prev, apiKey: '' })); // Clear API key after saving
        
        // Load event types
        if (formData.username) {
          loadEventTypes(formData.username);
        }
      } else {
        setError(response.data.error || 'Failed to save credentials');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your calendar?')) return;

    try {
      const response = await api.delete('/calendar/credentials');
      if (response.data.success) {
        setSuccess('Calendar disconnected successfully');
        setCredential(null);
        setFormData({
          apiKey: '',
          username: '',
          eventTypeId: '',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        setEventTypes([]);
      } else {
        setError(response.data.error || 'Failed to disconnect');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to disconnect');
    }
  };

  const handleTestConnection = async () => {
    if (!formData.apiKey || !formData.username) {
      setError('API Key and Username are required to test connection');
      return;
    }

    setTesting(true);
    setTestResult(null);
    setError('');

    try {
      const response = await api.post('/calendar/credentials', {
        ...formData,
        testOnly: true,
      });
      
      if (response.data.success) {
        setTestResult({ success: true, message: 'Connection successful! Your Cal.com credentials are valid.' });
        setSuccess('Credentials validated successfully');
      } else {
        setTestResult({ success: false, message: response.data.error || 'Connection failed' });
        setError(response.data.error || 'Connection failed');
      }
    } catch (err: any) {
      const message = err.response?.data?.error || 'Connection test failed';
      setTestResult({ success: false, message });
      setError(message);
    } finally {
      setTesting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-stone-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-12 bg-stone-200 rounded"></div>
            <div className="h-12 bg-stone-200 rounded"></div>
            <div className="h-12 bg-stone-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Calendar Integration</h1>
        <p className="text-stone-500">
          Connect your Cal.com calendar to schedule meetings with prospects directly from your AI agents.
        </p>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-2 text-green-700">
            <Check className="w-5 h-5" />
            <span className="font-medium">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Cal.com Integration</h2>
            <p className="text-sm text-stone-500">
              Connect your Cal.com account to enable meeting scheduling
            </p>
          </div>
        </div>

        {credential?.isActive ? (
          <div className="space-y-6">
            <div className="p-4 bg-stone-50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-stone-900">Connected to Cal.com</span>
                </div>
                <span className="text-sm text-stone-500">
                  Connected {new Date(credential.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="text-sm text-stone-600 space-y-1">
                <div>Username: <span className="font-medium">{credential.config.username}</span></div>
                {credential.config.eventTypeId && (
                  <div>
                    Event Type: <span className="font-medium">
                      {eventTypes.find(et => et.id.toString() === credential.config.eventTypeId)?.title || credential.config.eventTypeId}
                    </span>
                  </div>
                )}
                <div>Time Zone: <span className="font-medium">{credential.config.timeZone}</span></div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-stone-900 mb-3">Update Connection</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Cal.com API Key
                  </label>
                  <input
                    type="password"
                    name="apiKey"
                    value={formData.apiKey}
                    onChange={handleInputChange}
                    placeholder="Enter new API key (leave blank to keep current)"
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                  <p className="mt-1 text-xs text-stone-500">
                    Get your API key from{' '}
                    <a 
                      href="https://app.cal.com/settings/developer" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:text-amber-700 underline"
                    >
                      Cal.com Settings → Developer
                    </a>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Cal.com Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Time Zone
                    </label>
                    <select
                      name="timeZone"
                      value={formData.timeZone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    >
                      {Intl.supportedValuesOf('timeZone').map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {eventTypes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Event Type
                    </label>
                    <select
                      name="eventTypeId"
                      value={formData.eventTypeId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select an event type</option>
                      {eventTypes.map(eventType => (
                        <option key={eventType.id} value={eventType.id}>
                          {eventType.title} ({eventType.length} minutes)
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-stone-500">
                      Select which event type should be used for scheduled meetings
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? 'Updating...' : 'Update Connection'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing || !formData.apiKey || !formData.username}
                    className="px-5 py-2.5 border border-stone-300 text-stone-700 font-medium rounded-xl hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {testing ? 'Testing...' : 'Test Connection'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-5 py-2.5 border border-red-300 text-red-600 font-medium rounded-xl hover:bg-red-50 ml-auto transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium mb-1">Before you begin</p>
                  <p>You'll need a Cal.com account and an API key. Create one at{' '}
                    <a 
                      href="https://app.cal.com/settings/developer" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      Cal.com Settings → Developer
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Cal.com API Key
                </label>
                <input
                  type="password"
                  name="apiKey"
                  value={formData.apiKey}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  placeholder="cal_xxxxxxxxxxxxxxxx"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Cal.com Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    placeholder="your-username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Time Zone
                  </label>
                  <select
                    name="timeZone"
                    value={formData.timeZone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  >
                    {Intl.supportedValuesOf('timeZone').map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {testResult && (
              <div className={`p-4 rounded-xl ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {testResult.message}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Connecting...' : 'Connect Calendar'}
              </button>
              
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !formData.apiKey || !formData.username}
                className="px-5 py-2.5 border border-stone-300 text-stone-700 font-medium rounded-xl hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>

              <a
                href="https://cal.com"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
              >
                <span>Don't have Cal.com?</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-stone-100">
          <h3 className="text-sm font-medium text-stone-900 mb-3">How it works</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-stone-50 rounded-xl">
              <div className="text-amber-600 font-bold text-lg mb-2">1</div>
              <p className="text-sm text-stone-600">
                Connect your Cal.com account using your API key
              </p>
            </div>
            <div className="p-4 bg-stone-50 rounded-xl">
              <div className="text-amber-600 font-bold text-lg mb-2">2</div>
              <p className="text-sm text-stone-600">
                Your AI agents can schedule meetings with prospects during calls
              </p>
            </div>
            <div className="p-4 bg-stone-50 rounded-xl">
              <div className="text-amber-600 font-bold text-lg mb-2">3</div>
              <p className="text-sm text-stone-600">
                View and manage all scheduled meetings in the Meetings page
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">AI Agent Integration</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
            <div>
              <p className="font-medium text-stone-900">Meeting Scheduling Tool</p>
              <p className="text-sm text-stone-500">
                Available to all AI agents once calendar is connected
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${credential?.isActive ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
              {credential?.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
          
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-700">
              <span className="font-medium">Tip:</span> When creating AI agents, enable the "Meeting Scheduling" tool 
              to allow them to book appointments with prospects during calls.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}