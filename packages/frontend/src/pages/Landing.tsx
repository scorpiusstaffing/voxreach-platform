import { useNavigate } from 'react-router-dom';
import { Phone, PhoneOutgoing, ArrowRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-pattern relative overflow-hidden">
      {/* Soft Gradient Orbs for Luxury Feel */}
      <div className="gradient-orb-light w-[800px] h-[800px] -top-96 -right-64" />
      <div className="gradient-orb-light w-[600px] h-[600px] bottom-0 -left-48" style={{ animationDelay: '-6s' }} />
      <div className="gradient-orb-light w-[400px] h-[400px] top-1/3 right-1/4" style={{ animationDelay: '-3s' }} />
      
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto relative z-10">
        <div className="text-2xl font-bold text-amber-600 tracking-tight">Voxreach</div>
        <div className="flex gap-8 items-center">
          <button
            onClick={() => navigate('/pricing')}
            className="nav-link-premium"
          >
            Pricing
          </button>
          <a href="#features" className="nav-link-premium">Features</a>
          <button
            onClick={() => navigate('/login')}
            className="nav-link-premium"
          >
            Log in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center pt-28 pb-20 px-8 relative z-10">
        <h1 className="text-6xl md:text-7xl font-semibold text-stone-900 leading-[1.1] tracking-tight glow-amber">
          AI voice agents<br />
          <span className="text-gradient">that just work.</span>
        </h1>
        <p className="mt-8 text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed">
          Deploy AI-powered phone agents in minutes. Make outbound calls at scale or never miss an inbound call again.
        </p>
      </section>

      {/* Intent Selection */}
      <section className="max-w-4xl mx-auto px-8 pb-32 relative z-10">
        <p className="text-center text-stone-500 text-sm font-medium uppercase tracking-widest mb-12">
          What do you need?
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Outbound */}
          <button
            onClick={() => navigate('/signup?intent=outbound')}
            className="group premium-card-hover p-12 text-left"
          >
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
              <PhoneOutgoing className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-2xl font-semibold text-stone-900 mb-4">I want AI to make calls</h3>
            <p className="text-stone-600 leading-relaxed text-lg">
              Sales outreach, lead qualification, appointment setting, recruitment calls, follow-ups — at scale.
            </p>
            <div className="mt-8 flex items-center text-amber-600 font-medium">
              Get started <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Inbound */}
          <button
            onClick={() => navigate('/signup?intent=inbound')}
            className="group premium-card-hover p-12 text-left"
          >
            <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
              <Phone className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-2xl font-semibold text-stone-900 mb-4">I want AI to answer calls</h3>
            <p className="text-stone-600 leading-relaxed text-lg">
              Never miss a customer call. AI answers, books appointments, captures leads, and handles FAQs — 24/7.
            </p>
            <div className="mt-8 flex items-center text-amber-600 font-medium">
              Get started <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-10 text-center text-sm text-stone-500 relative z-10">
        © 2026 Voxreach. All rights reserved.
      </footer>
    </div>
  );
}
