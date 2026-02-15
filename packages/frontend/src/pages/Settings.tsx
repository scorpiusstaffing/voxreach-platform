import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { ArrowLeft, Settings2, User, Building2, Bell, Shield, CreditCard, Key, Save } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  intent?: 'inbound' | 'outbound' | 'both';
}

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'notifications' | 'security'>('profile');
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading]);

  useEffect(() => {
    if (user) {
      api.get('/auth/me')
        .then((res) => {
          if (res.data?.organization) {
            setOrganization(res.data.organization);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  if (authLoading || !user) return null;

  return (
    <div className="p-8 max-w-5xl">
      <Link to="/dashboard" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4">
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <Settings2 className="w-7 h-7 text-brand-600" />
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="col-span-1">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'profile' ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <User className="w-4 h-4" /> Profile
            </button>
            <button
              onClick={() => setActiveTab('organization')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'organization' ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Building2 className="w-4 h-4" /> Organization
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'notifications' ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Bell className="w-4 h-4" /> Notifications
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'security' ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Shield className="w-4 h-4" /> Security
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="col-span-3">
          <div className="bg-white rounded-xl border border-gray-200">
            {activeTab === 'profile' && (
              <ProfileSettings user={user} saving={saving} setSaving={setSaving} message={message} setMessage={setMessage} />
            )}
            {activeTab === 'organization' && (
              <OrganizationSettings organization={organization} saving={saving} setSaving={setSaving} message={message} setMessage={setMessage} />
            )}
            {activeTab === 'notifications' && (
              <NotificationSettings saving={saving} setSaving={setSaving} message={message} setMessage={setMessage} />
            )}
            {activeTab === 'security' && (
              <SecuritySettings saving={saving} setSaving={setSaving} message={message} setMessage={setMessage} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Profile Settings
// ============================================================
function ProfileSettings({ user, saving, setSaving, message, setMessage }: any) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.patch('/auth/profile', form);
      setMessage('Profile updated successfully');
    } catch (err: any) {
      setMessage(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Settings</h2>

      {message && (
        <div className={`mb-4 text-sm rounded-lg px-4 py-3 ${
          message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            type="email"
            value={form.email}
            disabled
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
          />
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );
}

// ============================================================
// Organization Settings
// ============================================================
function OrganizationSettings({ organization, saving, setSaving, message, setMessage }: any) {
  const [form, setForm] = useState({
    name: organization?.name || '',
    intent: organization?.intent || 'outbound',
  });

  useEffect(() => {
    if (organization) {
      setForm({ name: organization.name || '', intent: organization.intent || 'outbound' });
    }
  }, [organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.patch('/auth/organization', form);
      setMessage('Organization updated successfully');
    } catch (err: any) {
      setMessage(err.message || 'Failed to update organization');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization Settings</h2>

      {message && (
        <div className={`mb-4 text-sm rounded-lg px-4 py-3 ${
          message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary Use Case</label>
          <select
            value={form.intent}
            onChange={(e) => setForm((f: any) => ({ ...f, intent: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
          >
            <option value="outbound">Outbound Calls (Sales, Outreach)</option>
            <option value="inbound">Inbound Calls (Support, Reception)</option>
            <option value="both">Both</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            This helps us customize your experience and default templates
          </p>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );
}

// ============================================================
// Notification Settings
// ============================================================
function NotificationSettings({ saving, setSaving, message, setMessage }: any) {
  const [settings, setSettings] = useState({
    emailCallSummary: true,
    emailDailyDigest: false,
    emailCampaignComplete: true,
    webhookEnabled: false,
    webhookUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.patch('/auth/notifications', settings);
      setMessage('Notification settings saved');
    } catch (err: any) {
      setMessage(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>

      {message && (
        <div className={`mb-4 text-sm rounded-lg px-4 py-3 ${
          message.includes('success') || message.includes('saved') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Email Notifications</h3>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.emailCallSummary}
              onChange={(e) => setSettings((s: any) => ({ ...s, emailCallSummary: e.target.checked }))}
              className="w-4 h-4 accent-brand-600"
            />
            <span className="text-sm text-gray-700">Call summaries after each call</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.emailDailyDigest}
              onChange={(e) => setSettings((s: any) => ({ ...s, emailDailyDigest: e.target.checked }))}
              className="w-4 h-4 accent-brand-600"
            />
            <span className="text-sm text-gray-700">Daily activity digest</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.emailCampaignComplete}
              onChange={(e) => setSettings((s: any) => ({ ...s, emailCampaignComplete: e.target.checked }))}
              className="w-4 h-4 accent-brand-600"
            />
            <span className="text-sm text-gray-700">Campaign completion alerts</span>
          </label>
        </div>

        <div className="border-t border-gray-100 pt-4 mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Webhooks</h3>

          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={settings.webhookEnabled}
              onChange={(e) => setSettings((s: any) => ({ ...s, webhookEnabled: e.target.checked }))}
              className="w-4 h-4 accent-brand-600"
            />
            <span className="text-sm text-gray-700">Enable webhook notifications</span>
          </label>

          {settings.webhookEnabled && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Webhook URL</label>
              <input
                type="url"
                value={settings.webhookUrl}
                onChange={(e) => setSettings((s: any) => ({ ...s, webhookUrl: e.target.value }))}
                placeholder="https://your-app.com/webhook"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );
}

// ============================================================
// Security Settings
// ============================================================
function SecuritySettings({ saving, setSaving, message, setMessage }: any) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      await api.patch('/auth/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setMessage('Password updated successfully');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h2>

      {message && (
        <div className={`mb-4 text-sm rounded-lg px-4 py-3 ${
          message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
          <input
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm((f: any) => ({ ...f, currentPassword: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
          <input
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm((f: any) => ({ ...f, newPassword: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm((f: any) => ({ ...f, confirmPassword: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving || !form.currentPassword || !form.newPassword || !form.confirmPassword}
            className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            <Key className="w-4 h-4" />
            {saving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>
    </form>
  );
}
