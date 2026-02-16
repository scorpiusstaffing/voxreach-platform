import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, Zap, Shield, Users, BarChart, Calendar, Workflow, Globe, Clock, Mail, MessageSquare, ArrowRight, Star, Building2, HeadphonesIcon } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

interface Plan {
  id: string;
  name: string;
  price: number;
  annualPrice: number;
  priceId: string | null;
  annualPriceId: string | null;
  description: string;
  features: string[];
  limits: {
    agents: number;
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
  const [selectedPlan, setSelectedPlan] = useState<string>('growth');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/billing/plans');
      // Transform to include annual pricing
      const plansWithAnnual = response.plans.map((plan: Plan) => ({
        ...plan,
        annualPrice: Math.round(plan.price * 0.8), // 20% discount
      }));
      setPlans(plansWithAnnual);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      setPlans(getDefaultPlans());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPlans = (): Plan[] => [
    {
      id: 'starter',
      name: 'Starter',
      price: 49,
      annualPrice: 39,
      priceId: 'price_1T1IcGEz1QlPnm30neXXb7cP',
      annualPriceId: 'price_annual_starter',
      description: 'Perfect for solo founders and small businesses getting started with AI voice automation',
      features: [
        '1 AI Voice Agent with custom personality',
        'Custom conversation scripts & prompts',
        'Basic call analytics & recordings',
        'Email support (24hr response)',
        '1 phone number included',
        'Calendar integration (Google/Outlook)',
        'Call transcription',
        'Standard voice quality',
      ],
      limits: { agents: 1, phoneNumbers: 1 },
      cta: 'Start Free Trial',
    },
    {
      id: 'growth',
      name: 'Growth',
      price: 99,
      annualPrice: 79,
      priceId: 'price_1T1IcSEz1QlPnm30AfkFrvLy',
      annualPriceId: 'price_annual_growth',
      description: 'For scaling teams that need powerful automation and deeper insights',
      features: [
        '5 AI Voice Agents with unique personalities',
        'Advanced script customization & A/B testing',
        'Real-time analytics dashboard',
        'Priority support (4hr response)',
        '5 phone numbers included',
        'Calendar + CRM integration (HubSpot, Salesforce)',
        'AI call analysis & sentiment tracking',
        'Team collaboration & role management',
        'Custom workflows & triggers',
        'Premium voices (ElevenLabs, Azure)',
        'Voicemail detection & handling',
      ],
      limits: { agents: 5, phoneNumbers: 5 },
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 199,
      annualPrice: 159,
      priceId: 'price_1T1IckEz1QlPnm30n4X9J6mK',
      annualPriceId: 'price_annual_professional',
      description: 'Enterprise-grade automation for businesses that demand the best',
      features: [
        'Unlimited AI Voice Agents',
        'White-label & custom branding options',
        'Advanced analytics, reporting & exports',
        '24/7 dedicated support with SLA',
        'Unlimited phone numbers worldwide',
        'Full API access & webhooks',
        'Custom integrations (Zapier, Make, etc.)',
        'Dedicated account manager',
        'SSO & advanced security',
        'Custom AI model fine-tuning',
        'On-premise deployment option',
        'SLA guarantee (99.9% uptime)',
      ],
      limits: { agents: 999, phoneNumbers: 999 },
      cta: 'Start Free Trial',
    },
  ];

  const handleCheckout = async (planId: string) => {
    if (!user) {
      navigate('/signup');
      return;
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan?.priceId) {
      navigate('/dashboard');
      return;
    }

    setCheckoutLoading(true);
    try {
      const priceId = isAnnual && plan.annualPriceId 
        ? plan.annualPriceId 
        : plan.priceId;

      const response = await api.post('/billing/checkout', {
        priceId,
        successUrl: `${window.location.origin}/dashboard/billing/success`,
        cancelUrl: `${window.location.origin}/pricing`,
      });

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

  const scrollToPricing = () => {
    document.getElementById('pricing-plans')?.scrollIntoView({ behavior: 'smooth' });
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
      <section className="max-w-6xl mx-auto text-center pt-16 pb-12 px-8">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 text-sm font-medium px-4 py-2 rounded-full mb-6">
          <Sparkles className="w-4 h-4" />
          14-Day Free Trial — No Credit Card Required
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
          Pricing that <span className="text-cyan-400">scales with you</span>
        </h1>
        <p className="text-xl text-[#6B7280] max-w-3xl mx-auto leading-relaxed mb-8">
          Transform your business with AI voice agents. From automated sales calls to 24/7 customer support — 
          all without writing a single line of code.
        </p>
        
        {/* Social Proof */}
        <div className="flex items-center justify-center gap-8 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>500+ businesses trust Voxreach</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span>4.9/5 rating</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Enterprise-grade security</span>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <div className="max-w-6xl mx-auto px-8 mb-16">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Launch in Minutes</h3>
            <p className="text-[#6B7280]">Create AI agents with custom scripts and deploy instantly. No coding required.</p>
          </div>
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
              <HeadphonesIcon className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Human-Like Conversations</h3>
            <p className="text-[#6B7280]">Advanced AI models that understand context, handle objections, and book appointments naturally.</p>
          </div>
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
              <BarChart className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Actionable Insights</h3>
            <p className="text-[#6B7280]">Get detailed call analysis, sentiment tracking, and conversion metrics to optimize performance.</p>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="max-w-6xl mx-auto px-8 mb-8" id="pricing-plans">
        <div className="flex items-center justify-center gap-4">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-[#6B7280]'}`}>
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
          <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-[#6B7280]'}`}>
            Annual
          </span>
          <span className="bg-green-500/10 text-green-400 text-xs font-semibold px-2 py-1 rounded-full">
            Save 20%
          </span>
        </div>
      </div>

      {/* Pricing Plans */}
      <section className="max-w-6xl mx-auto px-8 pb-16">
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
                <p className="text-[#6B7280] mb-6 text-sm">{plan.description}</p>
                
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-bold text-white">
                    ${isAnnual ? plan.annualPrice : plan.price}
                  </span>
                  <span className="text-[#6B7280] ml-2">/month</span>
                </div>
                {isAnnual && (
                  <p className="text-green-400 text-sm">
                    Save ${(plan.price - plan.annualPrice) * 12}/year
                  </p>
                )}
              </div>

              <div className="mb-8">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#0F172A] rounded-xl p-4">
                    <div className="text-2xl font-bold text-white mb-1">
                      {plan.limits.agents === 999 ? '∞' : plan.limits.agents}
                    </div>
                    <div className="text-sm text-[#6B7280]">AI Agents</div>
                  </div>
                  <div className="bg-[#0F172A] rounded-xl p-4">
                    <div className="text-2xl font-bold text-white mb-1">
                      {plan.limits.phoneNumbers === 999 ? '∞' : plan.limits.phoneNumbers}
                    </div>
                    <div className="text-sm text-[#6B7280]">Phone Numbers</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span className="text-[#D1D5DB] text-sm">{feature}</span>
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
                    : 'bg-[#1E293B] text-white hover:bg-[#2D3748]'
                }`}
              >
                {checkoutLoading ? 'Processing...' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Enterprise CTA */}
        <div className="mt-16 bg-gradient-to-r from-[#0F172A] to-[#1E293B] border border-[#334155] rounded-3xl p-10 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Need a Custom Solution?</h3>
          <p className="text-xl text-[#94A3B8] max-w-2xl mx-auto mb-8">
            Large teams, unique requirements, or custom integrations? Let's build something perfect for your business.
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

      {/* Feature Comparison */}
      <section className="max-w-6xl mx-auto px-8 pb-32">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Compare All Features</h2>
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-4 gap-4 p-6 border-b border-[#1E293B] bg-[#161B22]">
            <div className="text-[#9CA3AF] font-medium">Feature</div>
            <div className="text-center text-white font-semibold">Starter</div>
            <div className="text-center text-cyan-400 font-semibold">Growth</div>
            <div className="text-center text-white font-semibold">Professional</div>
          </div>
          
          {[
            { name: 'AI Voice Agents', starter: '1', growth: '5', pro: 'Unlimited' },
            { name: 'Phone Numbers', starter: '1', growth: '5', pro: 'Unlimited' },
            { name: 'Custom Scripts', starter: true, growth: true, pro: true },
            { name: 'Calendar Integration', starter: true, growth: true, pro: true },
            { name: 'CRM Integration', starter: false, growth: true, pro: true },
            { name: 'Call Analysis', starter: 'Basic', growth: 'Advanced', pro: 'Enterprise' },
            { name: 'API Access', starter: false, growth: false, pro: true },
            { name: 'Priority Support', starter: false, growth: true, pro: '24/7 Dedicated' },
            { name: 'White-label', starter: false, growth: false, pro: true },
            { name: 'SSO & Security', starter: false, growth: false, pro: true },
          ].map((row, idx) => (
            <div key={idx} className="grid grid-cols-4 gap-4 p-4 border-b border-[#1E293B] last:border-0">
              <div className="text-[#D1D5DB]">{row.name}</div>
              <div className="text-center text-[#9CA3AF]">
                {typeof row.starter === 'boolean' ? (row.starter ? <Check className="w-5 h-5 text-cyan-400 mx-auto" /> : '—') : row.starter}
              </div>
              <div className="text-center text-white">
                {typeof row.growth === 'boolean' ? (row.growth ? <Check className="w-5 h-5 text-cyan-400 mx-auto" /> : '—') : row.growth}
              </div>
              <div className="text-center text-[#9CA3AF]">
                {typeof row.pro === 'boolean' ? (row.pro ? <Check className="w-5 h-5 text-cyan-400 mx-auto" /> : '—') : row.pro}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-8 pb-32">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Can I switch plans later?</h3>
              <p className="text-[#94A3B8]">Yes! You can upgrade or downgrade at any time. Changes take effect immediately, and we'll prorate any differences.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Is there a long-term contract?</h3>
              <p className="text-[#94A3B8]">No contracts. All plans are month-to-month or annual. Cancel anytime with no penalties.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">What payment methods do you accept?</h3>
              <p className="text-[#94A3B8]">All major credit cards via Stripe. We also support ACH for annual Professional plans.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Do you offer refunds?</h3>
              <p className="text-[#94A3B8]">Yes, we offer a 30-day money-back guarantee on all paid plans. No questions asked.</p>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Can I try before I buy?</h3>
              <p className="text-[#94A3B8]">Absolutely! Every plan includes a 14-day free trial with full features. No credit card required.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">What counts as an AI agent?</h3>
              <p className="text-[#94A3B8]">Each AI agent is a unique voice assistant with its own personality, script, and phone number assignments.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Do I pay per call or per minute?</h3>
              <p className="text-[#94A3B8]">No! Our pricing is feature-based, not usage-based. Make unlimited calls on any plan.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Need help deciding?</h3>
              <p className="text-[#94A3B8]">Contact our team at support@voxreach.io or book a demo with our sales team.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <div className="border-t border-[#1E293B] py-12">
        <div className="max-w-4xl mx-auto text-center px-8">
          <h3 className="text-2xl font-bold text-white mb-4">Ready to transform your business?</h3>
          <p className="text-[#94A3B8] mb-8">Join 500+ businesses using Voxreach for AI voice automation.</p>
          <button
            onClick={() => handleCheckout('growth')}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold px-8 py-4 rounded-xl hover:shadow-[0_0_30px_rgba(0,180,216,0.3)] transition-all"
          >
            Start Your 14-Day Free Trial
          </button>
          <p className="text-sm text-[#6B7280] mt-4">No credit card required · Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}
