import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, AlertCircle, CreditCard, Download, Calendar, Users, Phone, Clock, ArrowUpRight, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

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
    minutes: number;
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
  minutesUsed: number;
}

interface UsageStats {
  current: {
    calls: number;
    minutes: number;
  };
  yearly: {
    calls: number;
    minutes: number;
  };
  daily: Array<{
    date: string;
    calls: number;
    minutes: number;
  }>;
  limits: {
    calls: number;
    minutes: number;
  };
  percentageUsed: {
    calls: number;
    minutes: number;
  };
}

export default function Billing() {
  const navigate = useNavigate();
  const { user, organization } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

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

  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    try {
      const response = await api.post('/billing/checkout', {
        priceId: 'price_1T1IcGEz1QlPnm30neXXb7cP', // Starter plan
        successUrl: `${window.location.origin}/dashboard/billing/success`,
        cancelUrl: `${window.location.origin}/dashboard/billing`,
      });

      // Redirect to Stripe Checkout URL (redirectToCheckout is deprecated)
      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      alert(error.response?.data?.error || 'Failed to start upgrade');
    } finally {
      setUpgradeLoading(false);
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
      free: 'Free',
      starter: 'Starter',
      professional: 'Professional',
      enterprise: 'Enterprise',
    };
    return plans[plan] || plan;
  };

  const getPlanColor = (plan: string) => {
    const colors: Record<string, string> = {
      free: 'text-gray-400',
      starter: 'text-cyan-400',
      professional: 'text-blue-400',
      enterprise: 'text-purple-400',
    };
    return colors[plan] || 'text-gray-400';
  };

  const getPlanLimits = () => {
    const plan = subscription?.plan || 'free';
    const limits = {
      free: { agents: 1, calls: 50, minutes: 100, numbers: 1 },
      starter: { agents: 3, calls: 500, minutes: 1000, numbers: 3 },
      professional: { agents: 10, calls: 2000, minutes: 5000, numbers: 10 },
      enterprise: { agents: 100, calls: 10000, minutes: 25000, numbers: 50 },
    };
    return limits[plan as keyof typeof limits] || limits.free;
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
  const isTrial = subscription?.trialEndsAt && new Date(subscription.trialEndsAt) > new Date();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Billing & Usage</h1>
        <p className="text-[#94A3B8]">
          Manage your subscription, view invoices, and monitor usage.
        </p>
      </div>

      {/* Upgrade Banner for Free Plan */}
      {isFreePlan && (
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Unlock Full Potential</h3>
                <p className="text-[#94A3B8] mb-4">
                  Upgrade to access more agents, higher call limits, and premium features.
                </p>
                <button
                  onClick={() => navigate('/pricing')}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold px-6 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all"
                >
                  View Plans & Pricing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trial Warning */}
      {isTrial && subscription?.trialEndsAt && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Trial Ending Soon</h3>
              <p className="text-[#94A3B8]">
                Your free trial ends on {formatDate(subscription.trialEndsAt)}. Upgrade to keep your access.
              </p>
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
                      ${subscription?.plan === 'starter' ? '99' : '199'}/month
                    </span>
                  )}
                </div>
              </div>
              {subscription?.plan === 'free' ? (
                <button
                  onClick={() => navigate('/pricing')}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold px-6 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all"
                >
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
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-[#94A3B8]">Agents</span>
                </div>
                <div className="text-2xl font-bold text-white">{planLimits.agents}</div>
              </div>
              <div className="bg-[#0A0E17] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-[#94A3B8]">Calls/Month</span>
                </div>
                <div className="text-2xl font-bold text-white">{planLimits.calls}</div>
              </div>
              <div className="bg-[#0A0E17] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-[#94A3B8]">Minutes/Month</span>
                </div>
                <div className="text-2xl font-bold text-white">{planLimits.minutes}</div>
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
                {/* Calls Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-cyan-400" />
                      <span className="text-white font-medium">Calls</span>
                    </div>
                    <div className="text-white">
                      {usage.current.calls} / {usage.limits.calls}
                    </div>
                  </div>
                  <div className="h-2 bg-[#1E293B] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, usage.percentageUsed.calls)}%` }}
                    />
                  </div>
                  <div className="text-sm text-[#94A3B8] mt-1">
                    {usage.percentageUsed.calls >= 80 ? (
                      <span className="text-yellow-400">
                        {usage.percentageUsed.calls >= 100 ? 'Limit reached!' : 'Approaching limit'}
                      </span>
                    ) : (
                      `${usage.percentageUsed.calls}% of monthly limit`
                    )}
                  </div>
                </div>

                {/* Minutes Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span className="text-white font-medium">Minutes</span>
                    </div>
                    <div className="text-white">
                      {usage.current.minutes} / {usage.limits.minutes}
                    </div>
                  </div>
                  <div className="h-2 bg-[#1E293B] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, usage.percentageUsed.minutes)}%` }}
                    />
                  </div>
                  <div className="text-sm text-[#94A3B8] mt-1">
                    {usage.percentageUsed.minutes >= 80 ? (
                      <span className="text-yellow-400">
                        {usage.percentageUsed.minutes >= 100 ? 'Limit reached!' : 'Approaching limit'}
                      </span>
                    ) : (
                      `${usage.percentageUsed.minutes}% of monthly limit`
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[#1E293B]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-[#94A3B8]">Year-to-date</div>
                    <div className="text-white font-semibold">
                      {usage.yearly.calls} calls • {usage.yearly.minutes} minutes
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
                onClick={() => navigate('/pricing')}
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
              </div>
            )}
          </div>

          {/* Plan Limits */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Plan Limits</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">AI Agents</span>
                <span className="text-white font-medium">{planLimits.agents}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">Monthly Calls</span>
                <span className="text-white font-medium">{planLimits.calls}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">Monthly Minutes</span>
                <span className="text-white font-medium">{planLimits.minutes}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#94A3B8]">Phone Numbers</span>
                <span className="text-white font-medium">{planLimits.numbers}</span>
              </div>
            </div>
            
            {isFreePlan && (
              <button
                onClick={() => navigate('/pricing')}
                className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(0,180,216,0.3)] transition-all"
              >
                Upgrade for Higher Limits
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}