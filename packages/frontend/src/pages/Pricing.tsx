import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, Zap, Shield, Users, BarChart, Calendar, Workflow, Globe, Clock, Mail, MessageSquare, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

interface Plan {
  id: string;
  name: string;
  price: number;
  priceId: string | null;
  description: string;
  features: string[];
  limits: {
    agents: number;
    callsPerMonth: number;
    minutesPerMonth: number;
    phoneNumbers: number;
  };
  cta: string;
  popular?: boolean;
}

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string>('starter');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/billing/plans');
      setPlans(response.plans);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      // Fallback to default plans if API fails
      setPlans(getDefaultPlans());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPlans = (): Plan[] => [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      priceId: null,
      description: 'Perfect for trying out VoxReach',
      features: [
        '1 AI Agent',
        '50 calls/month',
        'Basic call analytics',
        'Email support',
        '14-day free trial',
      ],
      limits: {
        agents: 1,
        callsPerMonth: 50,
        minutesPerMonth: 100,
        phoneNumbers: 1,
      },
      cta: 'Start Free Trial',
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 99,
      priceId: 'price_1T1IcGEz1QlPnm30neXXb7cP',
      description: 'Scale Your Business with 24/7 AI Reception',
      features: [
        '3 AI Agents',
        '500 calls/month',
        'Advanced analytics',
        'Priority support',
        'Calendar integration',
        'Basic CRM features',
      ],
      limits: {
        agents: 3,
        callsPerMonth: 500,
        minutesPerMonth: 1000,
        phoneNumbers: 3,
      },
      cta: 'Get Started',
      popular: true,
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 199,
      priceId: 'price_1T1IcSEz1QlPnm30AfkFrvLy',
      description: 'Enterprise Automation at Startup Prices',
      features: [
        '10 AI Agents',
        '2000 calls/month',
        'Advanced analytics & reporting',
        '24/7 priority support',
        'Full CRM integration',
        'Team collaboration',
        'Custom workflows',
        'API access',
      ],
      limits: {
        agents: 10,
        callsPerMonth: 2000,
        minutesPerMonth: 5000,
        phoneNumbers: 10,
      },
      cta: 'Go Professional',
    },
  ];

  const handleCheckout = async (planId: string) => {
    if (!user) {
      navigate('/signup');
      return;
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan?.priceId) {
      // Free plan - redirect to dashboard
      navigate('/dashboard');
      return;
    }

    setCheckoutLoading(true);
    try {
      const response = await api.post('/billing/checkout', {
        priceId: plan.priceId,
        successUrl: `${window.location.origin}/dashboard/billing/success`,
        cancelUrl: `${window.location.origin}/pricing`,
      });

      // Redirect to Stripe Checkout URL (redirectToCheckout is deprecated)
      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.response?.data?.error || 'Failed to start checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E17] flex items-center justify-center">
        <div className="text-cyan-400">Loading plans...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E17]">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-cyan-400 tracking-tight">Voxreach</div>
        <div className="flex gap-6 items-center">
          <button
            onClick={() => navigate('/')}
            className="text-[#9CA3AF] hover:text-white text-sm font-medium"
          >
            Home
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
          >
            {user ? 'Dashboard' : 'Log in'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto text-center pt-16 pb-20 px-8">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 text-sm font-medium px-4 py-2 rounded-full mb-6">
          <Sparkles className="w-4 h-4" />
          Start Your AI Voice Journey
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
          Pricing that <span className="text-cyan-400">grows with you</span>
        </h1>
        <p className="text-xl text-[#6B7280] max-w-3xl mx-auto leading-relaxed">
          From solo entrepreneurs to scaling teams. Get enterprise-grade AI voice automation at startup prices.
        </p>
      </section>

      {/* Value Propositions */}
      <div className="max-w-6xl mx-auto px-8 mb-16">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Launch in Minutes</h3>
            <p className="text-[#6B7280]">No coding required. Set up your AI agent and start taking calls immediately.</p>
          </div>
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Enterprise Security</h3>
            <p className="text-[#6B7280">Bank-level encryption and compliance. Your data stays private and secure.</p>
          </div>
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">24/7 Availability</h3>
            <p className="text-[#6B7280]">Never miss a call. Your AI agent works around the clock, weekends included.</p>
          </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <section className="max-w-6xl mx-auto px-8 pb-32">
        <div className="grid lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-8 ${
                plan.popular
                  ? 'border-2 border-cyan-500 bg-gradient-to-b from-[#0A0E17] to-[#0F172A] shadow-[0_0_40px_rgba(0,180,216,0.15)]'
                  : 'border border-[#1E293B] bg-[#0A0E17]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-[#6B7280] mb-6">{plan.description}</p>
                
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  {plan.price > 0 && <span className="text-[#6B7280] ml-2">/month</span>}
                </div>
                {plan.price === 0 && (
                  <div className="text-cyan-400 text-sm font-medium">No credit card required</div>
                )}
              </div>

              <div className="mb-8">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#0F172A] rounded-xl p-4">
                    <div className="text-2xl font-bold text-white mb-1">{formatNumber(plan.limits.agents)}</div>
                    <div className="text-sm text-[#6B7280]">AI Agents</div>
                  </div>
                  <div className="bg-[#0F172A] rounded-xl p-4">
                    <div className="text-2xl font-bold text-white mb-1">{formatNumber(plan.limits.callsPerMonth)}</div>
                    <div className="text-sm text-[#6B7280]">Calls/Month</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-[#D1D5DB]">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={checkoutLoading}
                className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-[0_0_30px_rgba(0,180,216,0.3)]'
                    : plan.price === 0
                    ? 'bg-[#1E293B] text-white hover:bg-[#2D3748]'
                    : 'bg-white text-[#0A0E17] hover:bg-gray-100'
                }`}
              >
                {checkoutLoading ? 'Processing...' : plan.cta}
              </button>

              {plan.price === 0 && (
                <div className="text-center mt-4 text-sm text-[#6B7280]">
                  14-day free trial of all features
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Enterprise CTA */}
        <div className="mt-16 bg-gradient-to-r from-[#0F172A] to-[#1E293B] border border-[#334155] rounded-3xl p-10 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Need Enterprise Scale?</h3>
          <p className="text-xl text-[#94A3B8] max-w-2xl mx-auto mb-8">
            Custom plans for large teams, unlimited calls, dedicated support, and custom integrations.
          </p>
          <button
            onClick={() => window.open('mailto:sales@voxreach.io')}
            className="inline-flex items-center gap-2 bg-white text-[#0A0E17] font-semibold px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors"
          >
            Contact Sales
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-8 pb-32">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Can I switch plans later?</h3>
              <p className="text-[#94A3B8]">Yes! You can upgrade or downgrade at any time. Changes take effect immediately.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Is there a long-term contract?</h3>
              <p className="text-[#94A3B8]">No contracts. All plans are month-to-month. Cancel anytime.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">What payment methods do you accept?</h3>
              <p className="text-[#94A3B8]">All major credit cards via Stripe. We don't store your payment information.</p>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Do you offer refunds?</h3>
              <p className="text-[#94A3B8]">Yes, we offer a 30-day money-back guarantee on all paid plans.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Can I try before I buy?</h3>
              <p className="text-[#94A3B8]">Absolutely! Start with our free plan, no credit card required.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Need help deciding?</h3>
              <p className="text-[#94A3B8]">Contact our team at support@voxreach.io for personalized recommendations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <div className="border-t border-[#1E293B] py-12">
        <div className="max-w-4xl mx-auto text-center px-8">
          <h3 className="text-2xl font-bold text-white mb-4">Ready to transform your phone system?</h3>
          <p className="text-[#94A3B8] mb-8">Join thousands of businesses using VoxReach for 24/7 AI reception.</p>
          <button
            onClick={() => handleCheckout('starter')}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold px-8 py-4 rounded-xl hover:shadow-[0_0_30px_rgba(0,180,216,0.3)] transition-all"
          >
            Start Your Free Trial
          </button>
        </div>
      </div>
    </div>
  );
}