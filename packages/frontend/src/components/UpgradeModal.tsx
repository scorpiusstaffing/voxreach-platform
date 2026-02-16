import { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight, Check, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

interface Plan {
  id: string;
  name: string;
  price: number;
  annualPrice: number;
  description: string;
  features: string[];
  limits: {
    agents: number;
    phoneNumbers: number;
  };
  cta: string;
  popular?: boolean;
}

interface Subscription {
  plan: string;
  status: string;
  trialEndsAt: string | null;
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
  limitType?: 'agents' | 'phoneNumbers' | 'calls';
  currentUsage?: number;
  limit?: number;
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    annualPrice: 39,
    description: 'Perfect for solo founders and small businesses',
    features: [
      '1 AI Voice Agent',
      'Custom conversation scripts',
      'Basic call analytics',
      'Email support',
      '1 phone number',
      'Calendar integration',
    ],
    limits: { agents: 1, phoneNumbers: 1 },
    cta: 'Get Started',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 99,
    annualPrice: 79,
    description: 'For scaling teams that need more power',
    features: [
      '5 AI Voice Agents',
      'Advanced script customization',
      'Real-time analytics dashboard',
      'Priority support',
      '5 phone numbers',
      'Calendar + CRM integration',
      'Call transcription & analysis',
      'Team collaboration tools',
    ],
    limits: { agents: 5, phoneNumbers: 5 },
    cta: 'Upgrade Now',
    popular: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 199,
    annualPrice: 159,
    description: 'Enterprise automation at startup prices',
    features: [
      'Unlimited AI Voice Agents',
      'White-label options',
      'Advanced analytics & reporting',
      '24/7 dedicated support',
      'Unlimited phone numbers',
      'Full API access',
      'Custom workflows & integrations',
      'Dedicated account manager',
      'SSO & advanced security',
    ],
    limits: { agents: 999, phoneNumbers: 999 },
    cta: 'Go Professional',
  },
];

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  currentPlan = 'free',
  limitType = 'agents',
  currentUsage = 0,
  limit = 0
}: UpgradeModalProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSubscription();
    }
  }, [isOpen]);

  const fetchSubscription = async () => {
    try {
      const response = await api.get('/billing/subscription');
      setSubscription(response);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  const handleCheckout = async (planId: string) => {
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return;

    setCheckoutLoading(true);
    try {
      // Get the appropriate price ID based on billing cycle
      const priceId = isAnnual 
        ? getAnnualPriceId(planId)
        : getMonthlyPriceId(planId);

      const response = await api.post('/billing/checkout', {
        priceId,
        successUrl: `${window.location.origin}/dashboard/billing/success`,
        cancelUrl: `${window.location.origin}/dashboard/billing`,
      });

      if (response.url) {
        window.location.href = response.url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.response?.data?.error || 'Failed to start checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const getMonthlyPriceId = (planId: string) => {
    const priceIds: Record<string, string> = {
      starter: 'price_1T1IcGEz1QlPnm30neXXb7cP',
      growth: 'price_1T1IcSEz1QlPnm30AfkFrvLy',
      professional: 'price_1T1IckEz1QlPnm30n4X9J6mK',
    };
    return priceIds[planId] || '';
  };

  const getAnnualPriceId = (planId: string) => {
    const priceIds: Record<string, string> = {
      starter: 'price_annual_starter',
      growth: 'price_annual_growth',
      professional: 'price_annual_professional',
    };
    return priceIds[planId] || getMonthlyPriceId(planId);
  };

  const getLimitMessage = () => {
    switch (limitType) {
      case 'agents':
        return `You've reached your limit of ${limit} AI agent${limit !== 1 ? 's' : ''}. Upgrade to add more agents and unlock additional features.`;
      case 'phoneNumbers':
        return `You've reached your limit of ${limit} phone number${limit !== 1 ? 's' : ''}. Upgrade to add more numbers.`;
      case 'calls':
        return `You're approaching your monthly call limit. Upgrade for unlimited calls and premium features.`;
      default:
        return 'Upgrade your plan to unlock more features.';
    }
  };

  const getTrialDaysLeft = () => {
    if (!subscription?.trialEndsAt) return null;
    const trialEnd = new Date(subscription.trialEndsAt);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const trialDaysLeft = getTrialDaysLeft();
  const availablePlans = PLANS.filter(p => {
    // Only show plans higher than current
    const planOrder = ['free', 'starter', 'growth', 'professional'];
    return planOrder.indexOf(p.id) > planOrder.indexOf(currentPlan);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white border border-stone-200 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white p-6 border-b border-stone-200 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-600" />
              Upgrade Your Plan
            </h2>
            {trialDaysLeft !== null && trialDaysLeft > 0 && (
              <p className="text-sm text-amber-400 mt-1">
                ⏰ {trialDaysLeft} days left in your free trial
              </p>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-stone-500 hover:text-stone-900 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Limit Warning */}
        <div className="p-6 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-stone-900">{getLimitMessage()}</h3>
              <p className="text-sm text-stone-500 mt-1">
                Choose a plan below to continue growing your business.
              </p>
            </div>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="p-6 border-b border-stone-200">
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-stone-900' : 'text-stone-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isAnnual ? 'bg-cyan-500' : 'bg-[#1E293B]'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-stone-900' : 'text-stone-500'}`}>
              Annual
            </span>
            <span className="bg-green-500/10 text-green-400 text-xs font-semibold px-2 py-1 rounded-full">
              Save 20%
            </span>
          </div>
        </div>

        {/* Plans */}
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            {availablePlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 ${
                  plan.popular
                    ? 'border-2 border-cyan-500 bg-gradient-to-b from-[#0A0E17] to-[#0F172A]'
                    : 'border border-stone-200 bg-white'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-xl font-bold text-stone-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-stone-500">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-stone-900">
                      ${isAnnual ? plan.annualPrice : plan.price}
                    </span>
                    <span className="text-stone-500 ml-2">/month</span>
                  </div>
                  {isAnnual && (
                    <p className="text-sm text-green-400 mt-1">
                      Save ${(plan.price - plan.annualPrice) * 12}/year
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span className="text-[#D1D5DB]">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={checkoutLoading}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 hover:shadow-[0_0_20px_rgba(0,180,216,0.3)]'
                      : 'bg-[#1E293B] text-stone-900 hover:bg-[#2D3748]'
                  }`}
                >
                  {checkoutLoading ? (
                    'Processing...'
                  ) : (
                    <>
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-stone-200 text-center">
          <p className="text-sm text-stone-500">
            Need a custom plan?{' '}
            <a href="mailto:sales@voxreach.io" className="text-amber-600 hover:text-cyan-300">
              Contact our sales team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
