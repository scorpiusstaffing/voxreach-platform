import { useNavigate } from 'react-router-dom';
import { Phone, PhoneOutgoing, ArrowRight } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0E17]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-cyan-400 tracking-tight">Voxreach</div>
        <div className="flex gap-6 items-center">
          <a href="#pricing" className="text-[#9CA3AF] hover:text-white text-sm font-medium">Pricing</a>
          <a href="#features" className="text-[#9CA3AF] hover:text-white text-sm font-medium">Features</a>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-cyan-400 hover:text-cyan-300"
          >
            Log in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center pt-24 pb-20 px-8">
        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight">
          AI voice agents<br />
          <span className="text-cyan-400">that just work.</span>
        </h1>
        <p className="mt-6 text-xl text-[#6B7280] max-w-2xl mx-auto leading-relaxed">
          Deploy AI-powered phone agents in minutes. Make outbound calls at scale or never miss an inbound call again.
        </p>
      </section>

      {/* Intent Selection */}
      <section className="max-w-4xl mx-auto px-8 pb-32">
        <p className="text-center text-[#6B7280] text-sm font-medium uppercase tracking-wider mb-8">
          What do you need?
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Outbound */}
          <button
            onClick={() => navigate('/signup?intent=outbound')}
            className="group relative bg-[#0A0E17] border-2 border-[#21262D] rounded-2xl p-10 text-left hover:border-cyan-500 hover:shadow-[0_0_30px_rgba(0,180,216,0.15)] transition-all duration-200"
          >
            <div className="w-14 h-14 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition-colors">
              <PhoneOutgoing className="w-7 h-7 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">I want AI to make calls</h3>
            <p className="text-[#6B7280] leading-relaxed">
              Sales outreach, lead qualification, appointment setting, recruitment calls, follow-ups — at scale.
            </p>
            <div className="mt-6 flex items-center text-cyan-400 font-medium text-sm">
              Get started <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Inbound */}
          <button
            onClick={() => navigate('/signup?intent=inbound')}
            className="group relative bg-[#0A0E17] border-2 border-[#21262D] rounded-2xl p-10 text-left hover:border-cyan-500 hover:shadow-[0_0_30px_rgba(0,180,216,0.15)] transition-all duration-200"
          >
            <div className="w-14 h-14 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition-colors">
              <Phone className="w-7 h-7 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">I want AI to answer calls</h3>
            <p className="text-[#6B7280] leading-relaxed">
              Never miss a customer call. AI answers, books appointments, captures leads, and handles FAQs — 24/7.
            </p>
            <div className="mt-6 flex items-center text-cyan-400 font-medium text-sm">
              Get started <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-[#6B7280]">
        © 2026 Voxreach. All rights reserved.
      </footer>
    </div>
  );
}
