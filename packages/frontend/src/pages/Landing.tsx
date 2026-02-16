import { useNavigate } from 'react-router-dom';
import { Phone, PhoneOutgoing, ArrowRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black bg-grid">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto relative z-10">
        <div className="text-2xl font-bold text-cyan-400 tracking-tight">Voxreach</div>
        <div className="flex gap-6 items-center">
          <button
            onClick={() => navigate('/pricing')}
            className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
          >
            Pricing
          </button>
          <a href="#features" className="text-gray-400 hover:text-white text-sm font-medium transition-colors">Features</a>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Log in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center pt-32 pb-24 px-8 relative z-10">
        <h1 className="text-6xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight">
          AI voice agents<br />
          <span className="text-gradient">that just work.</span>
        </h1>
        <p className="mt-8 text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Deploy AI-powered phone agents in minutes. Make outbound calls at scale or never miss an inbound call again.
        </p>
      </section>

      {/* Intent Selection */}
      <section className="max-w-4xl mx-auto px-8 pb-32 relative z-10">
        <p className="text-center text-gray-500 text-sm font-medium uppercase tracking-widest mb-10">
          What do you need?
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Outbound */}
          <button
            onClick={() => navigate('/signup?intent=outbound')}
            className="group relative glass rounded-2xl p-10 text-left card-hover"
          >
            <div className="w-14 h-14 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition-all duration-300">
              <PhoneOutgoing className="w-7 h-7 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">I want AI to make calls</h3>
            <p className="text-gray-400 leading-relaxed">
              Sales outreach, lead qualification, appointment setting, recruitment calls, follow-ups — at scale.
            </p>
            <div className="mt-6 flex items-center text-cyan-400 font-medium text-sm group-hover:text-cyan-300 transition-colors">
              Get started <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Inbound */}
          <button
            onClick={() => navigate('/signup?intent=inbound')}
            className="group relative glass rounded-2xl p-10 text-left card-hover"
          >
            <div className="w-14 h-14 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition-all duration-300">
              <Phone className="w-7 h-7 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">I want AI to answer calls</h3>
            <p className="text-gray-400 leading-relaxed">
              Never miss a customer call. AI answers, books appointments, captures leads, and handles FAQs — 24/7.
            </p>
            <div className="mt-6 flex items-center text-cyan-400 font-medium text-sm group-hover:text-cyan-300 transition-colors">
              Get started <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-gray-500 relative z-10">
        © 2026 Voxreach. All rights reserved.
      </footer>
    </div>
  );
}
