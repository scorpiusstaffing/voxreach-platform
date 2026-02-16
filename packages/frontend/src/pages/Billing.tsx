import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, AlertCircle, CreditCard, Download, Calendar, Users, Phone, Clock, ArrowUpRight, Sparkles, X, ArrowRight, Bot } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import UpgradeModal from '../components/UpgradeModal';

interface Subscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  invoices: Invoice[];
  usageRecords: UsageRecord[];
  currentUsage?: {
    calls: number;
    agents: number;
  };
}

interface Invoice {
  id: string;
  stripeInvoiceId: string;
  amount: number;
  currency: string;
  status: string;
  pdfUrl: string | null;
  hostedInvoiceUrl: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface UsageRecord {
  id: string;
  date: string;
  callsCount: number;
}

interface UsageStats {
  current: {
    calls: number;
    agents: number;
  };
  yearly: {
    calls: number;
  };
  daily: Array<{
    date: string;
    calls: number;
  }>;
  limits: {
    calls: number;
    agents: number;
  };
  percentageUsed: {
    calls: number;
    agents: number;
  };
}

export default function Billing() {
  const navigate = useNavigate();
  const { user, organization } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTrigger, setUpgradeTrigger] = useState<'agents' | 'calls'>('agents');

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const [subResponse, usageResponse] = await Promise.all([
        api.get('/billing/subscription'),
        api.get('/billing/usage'),
      ]);
      setSubscription(subResponse);
      setUsage(usageResponse);
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const response = await api.post('/billing/portal');
      window.location.href = response.url;
    } catch (error: any) {
      console.error('Failed to create portal session:', error);
      alert(error.response?.data?.error || 'Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getPlanName = (plan: string) => {
    const plans: Record<string, string> = {
      free: 'Free Trial',
      starter: 'Starter',
      growth: 'Growth',
      professional: 'Professional',
      enterprise: 'Enterprise',
    };
    return plans[plan] || plan;
  };

  const getPlanColor = (plan: string) => {
    const colors: Record<string, string> = {
      free: 'text-gray-400',
      starter: 'text-cyan-400',
      growth: 'text-blue-400',
      professional: 'text-purple-400',
      enterprise: 'text-amber-400',
    };
    return colors[plan] || 'text-gray-400';
  };

  const getPlanLimits = () => {
    const plan = subscription?.plan || 'free';
    const limits = {
      free: { agents: 1, calls: 50, phoneNumbers: 1 },
      starter: { agents: 1, calls: 500, phoneNumbers: 1 },
      growth: { agents: 5, calls: 2000, phoneNumbers: 5 },
      professional: { agents: 999, calls: 99999, phoneNumbers: 999 },
      enterprise: { agents: 999, calls: 99999, phoneNumbers: 999 },
    };
    return limits[plan as keyof typeof limits] || limits.free;
  };

  const getTrialDaysLeft = () => {
    if (!subscription?.trialEndsAt) return null;
    const trialEnd = new Date(subscription.trialEndsAt);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getUrgencyColor = (daysLeft: number) => {
    if (daysLeft <= 3) return 'text-red-400 border-red-500/30 bg-red-500/10';
    if (daysLeft <= 7) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-cyan-400">Loading billing information...</div>
      </div>
    );
  }

  const planLimits = getPlanLimits();
  const isFreePlan = subscription?.plan === 'free';
  const trialDaysLeft = getTrialDaysLeft();
  const isTrial = trialDaysLeft !== null && trialDaysLeft > 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Billing & Usage</h1>
        <p className="text-[#94A3B8]">
          Manage your subscription, view invoices, and monitor your AI agents.
        </p>
      </div>

      {/* Trial Countdown Banner */}
      {isTrial && (
        <div className={`rounded-2xl p-6 mb-8 border ${getUrgencyColor(trialDaysLeft)}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                trialDaysLeft <= 3 ? 'bg-red-500/20' : trialDaysLeft <= 7 ? 'bg-amber-500/20' : 'bg-cyan-500/20'
              }`}>
                <Clock className={`w-6 h-6 ${
                  trialDaysLeft <= 3 ? 'text-red-400' : trialDaysLeft <= 7 ? 'text-amber-400' : 'text-cyan-400'
                }`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {trialDaysLeft === 1 ? 'Your trial ends tomorrow!' : 
                   trialDaysLeft <= 3 ? `Your trial ends in ${trialDaysLeft} days!` :
                   `${trialDaysLeft} days left in your free trial`}
                </h3>
                <p className="text-[#94A3B8] mb-4">
                  {trialDaysLeft <= 3 
                    ? "Don't lose access to your AI agents. Upgrade now to keep everything running."
                    : "Upgrade anytime to continue using all features after your trial ends."}
                </p>
                <button
                  onClick={() => { setUpgradeTrigger('agents'); setShowUpgradeModal(true); }}
                  className={`font-semibold px-6 py-3 rounded-xl transition-all flex items-center gap-2 ${
                    trialDaysLeft <= 3
                      ? 'bg-red-500 text-white hover:bg-red-400'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-[0_0_20px_rgba(0,180,216,0.3)]'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Upgrade Now
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${
                trialDaysLeft <= 3 ? 'text-red-400' : trialDaysLeft <= 7 ? 'text-amber-400' : 'text-cyan-400'
              }`}>
                {trialDaysLeft}
              </div>
              <div className="text-sm text-[#94A3B8]">days left</div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Banner for Free Plan (non-trial) */}
      {isFreePlan && !isTrial && (
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Unlock Your Full Potential</h3>
                <p className="text-[#94A3B8] mb-4">
                  You're currently on the free plan. Upgrade to create more AI agents and unlock premium features.
                </p>
                <button
                  onClick={() => { setUpgradeTrigger('agents'); setShowUpgradeModal(true); }}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold px-6 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  View Plans & Pricing
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Subscription & Usage */}
        <div className="lg:col-span-2 space-y-8">
          {/* Current Plan Card */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">Current Plan</h2>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${getPlanColor(subscription?.plan || 'free')}`}>
                    {getPlanName(subscription?.plan || 'free')}
                  </span>
                  {subscription?.plan !== 'free' && (
                    <span className="text-lg text-white">
                      ${subscription?.plan === 'starter' ? '49' : subscription?.plan === 'growth' ? '99' : '199'}/month
                    </span>
                  )}
                </div>
              </div>
              {subscription?.plan === 'free' ? (
                <button
                  onClick={() => { setUpgradeTrigger('agents'); setShowUpgradeModal(true); }}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold px-6 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Upgrade Plan
                </button>
              ) : (
                <button
                  onClick={handlePortal}
                  disabled={portalLoading}
                  className="bg-[#1E293B] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#2D3748] transition-colors disabled:opacity-50"
                >
                  {portalLoading ? 'Loading...' : 'Manage Subscription'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#0A0E17] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-[#94A3B8]">AI Agents</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {usage?.current.agents || 0} / {planLimits.agents === 999 ? '∞' : planLimits.agents}
                </div>
              </div>
              <div className="bg-[#0A0E17] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-[#94A3B8]">Phone Numbers</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {planLimits.phoneNumbers === 999 ? '∞' : planLimits.phoneNumbers}
                </div>
              </div>
              <div className="bg-[#0A0E17] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-[#94A3B8]">Calls This Month</span>
                </div>
                <div className="text-2xl font-bold text-white">{usage?.current.calls || 0}</div>
              </div>
              <div className="bg-[#0A0E17] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-[#94A3B8]">Status</span>
                </div>
                <div className="text-2xl font-bold text-white capitalize">
                  {subscription?.status || 'active'}
                </div>
              </div>
            </div>

            {subscription?.currentPeriodEnd && (
              <div className="text-sm text-[#94A3B8]">
                Current billing period ends on {formatDate(subscription.currentPeriodEnd)}
                {subscription?.cancelAtPeriodEnd && (
                  <span className="text-yellow-400 ml-2">• Cancels at period end</span>
                )}
              </div>
            )}
          </div>

          {/* Usage Stats */}
          {usage && (
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Usage This Month</h2>
              
              <div className="space-y-6">
                {/* Agents Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-cyan-400" />
                      <span className="text-white font-medium">AI Agents</span>
                    </div>
                    <div className="text-white">
                      {usage.current.agents} / {usage.limits.agents === 999 ? 'Unlimited' : usage.limits.agents}
                    </div>
                  </div>
                  <div className="h-2 bg-[#1E293B] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, usage.percentageUsed.agents)}%` }}
                    />
                  </div>
                  <div className="text-sm text-[#94A3B8] mt-1">
                    {usage.percentageUsed.agents >= 80 ? (
                      <span className="text-yellow-400">
                        {usage.percentageUsed.agents >= 100 
                          ? 'Limit reached! Upgrade to add more agents.' 
                          : 'Approaching limit — consider upgrading'}
                      </span>
                    ) : (
                      `${usage.percentageUsed.agents}% of limit used`
                    )}
                  </div>
                  {usage.percentageUsed.agents >= 80 && (
                    <button
                      onClick={() => { setUpgradeTrigger('agents'); setShowUpgradeModal(true); }}
                      className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                    >
                      Upgrade for more agents
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Calls Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-cyan-400" />
                      <span className="text-white font-medium">Calls</span>
                    </div>
                    <div className="text-white">
                      {usage.current.calls} {usage.limits.calls < 99999 && `/ ${usage.limits.calls}`}
                    </div>
                  </div>
                  {usage.limits.calls < 99999 && (
                    <>
                      <div className="h-2 bg-[#1E293B] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, usage.percentageUsed.calls)}%` }}
                        />
                      </div>
                      <div className="text-sm text-[#94A3B8] mt-1">
                        {usage.percentageUsed.calls >= 80 ? (
                          <span className="text-yellow-400">
                            Approaching monthly call limit
                          </span>
                        ) : (
                          `${usage.percentageUsed.calls}% of monthly limit`
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[#1E293B]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-[#94A3B8]">Year-to-date</div>
                    <div className="text-white font-semibold">
                      {usage.yearly.calls} calls processed
                    </div>
                  </div>
                  <button
                    onClick={fetchBillingData}
                    className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Invoices & Actions */}
        <div className="space-y-8">
          {/* Billing Actions */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Billing Actions</h2>
            <div className="space-y-3">
              <button
                onClick={handlePortal}
                disabled={portalLoading || isFreePlan}
                className="w-full flex items-center justify-between p-4 bg-[#1E293B] hover:bg-[#2D3748] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-cyan-400" />
                  <span className="text-white font-medium">Manage Payment Methods</span>
                </div>
                <ArrowUpRight className="w-5 h-5 text-[#94A3B8]" />
              </button>

              <button
                onClick={() => { setUpgradeTrigger('agents'); setShowUpgradeModal(true); }}
                className="w-full flex items-center justify-between p-4 bg-[#1E293B] hover:bg-[#2D3748] rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <span className="text-white font-medium">View All Plans</span>
                </div>
                <ArrowUpRight className="w-5 h-5 text-[#94A3B8]" />
              </button>

              <button
                onClick={() => window.open('mailto:support@voxreach.io')}
                className="w-full flex items-center justify-between p-4 bg-[#1E293B] hover:bg-[#2D3748] rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-cyan-400" />
                  <span className="text-white font-medium">Contact Support</span>
                </div>
                <ArrowUpRight className="w-5 h-5 text-[#94A3B8]" />
              </button>
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Recent Invoices</h2>
            
            {subscription?.invoices && subscription.invoices.length > 0 ? (
              <div className="space-y-4">
                {subscription.invoices.slice(0, 3).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 bg-[#0A0E17] rounded-xl">
                    <div>
                      <div className="text-white font-medium">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </div>
                      <div className="text-sm text-[#94A3B8]">
                        {formatDate(invoice.paidAt || invoice.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'paid' 
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {invoice.status}
                      </span>
                      {invoice.pdfUrl && (
                        <button
                          onClick={() => window.open(invoice.pdfUrl!)}
                          className="p-2 hover:bg-[#1E293B] rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4 text-[#94A3B8]" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {subscription.invoices.length > 3 && (
                  <button
                    onClick={handlePortal}
                    className="w-full text-center text-cyan-400 hover:text-cyan-300 text-sm font-medium py-3"
                  >
                    View all {subscription.invoices.length} invoices
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-[#1E293B] mx-auto mb-4" />
                <div className="text-[#94A3B8]">No invoices yet</div>
                <p className="text-sm text-[#6B7280] mt-1">
                  Invoices will appear here after your first payment
                </p>
              </div>
            )}
          </div>

          {/* Plan Limits */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Plan Limits</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">AI Agents</span>
                <span className="text-white font-medium">
                  {planLimits.agents === 999 ? 'Unlimited' : planLimits.agents}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">Phone Numbers</span>
                <span className="text-white font-medium">
                  {planLimits.phoneNumbers === 999 ? 'Unlimited' : planLimits.phoneNumbers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">Monthly Calls</span>
                <span className="text-white font-medium">
                  {planLimits.calls >= 99999 ? 'Unlimited' : planLimits.calls}
                </span>
              </div>
            </div>
            
            {isFreePlan && (
              <button
                onClick={() => { setUpgradeTrigger('agents'); setShowUpgradeModal(true); }}
                className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade for Higher Limits
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={subscription?.plan || 'free'}
        limitType={upgradeTrigger}
        currentUsage={upgradeTrigger === 'agents' ? usage?.current.agents : usage?.current.calls}
        limit={upgradeTrigger === 'agents' ? planLimits.agents : planLimits.calls}
      />
    </div>
  );
}
