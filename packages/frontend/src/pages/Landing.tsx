import { useNavigate } from 'react-router-dom';
import { Phone, PhoneOutgoing, ArrowRight, Construction, Shield, Clock, Mail } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 relative overflow-hidden">
      {/* Construction Banner */}
      <div className="bg-amber-500 text-white py-3 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          <Construction className="w-5 h-5" />
          <span className="font-medium">VoxReach is currently under construction. Launching soon!</span>
          <button 
            onClick={() => navigate('/login')}
            className="ml-4 bg-white text-amber-700 hover:bg-amber-50 px-4 py-1 rounded-full text-sm font-medium transition-colors"
          >
            Preview
          </button>
        </div>
      </div>
      
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-stone-900">VoxReach</span>
        </div>
        <div className="flex gap-8 items-center">
          <button
            onClick={() => navigate('/blog')}
            className="text-stone-600 hover:text-stone-900 font-medium transition-colors"
          >
            Blog
          </button>
          <button
            onClick={() => navigate('/pricing')}
            className="text-stone-600 hover:text-stone-900 font-medium transition-colors"
          >
            Pricing
          </button>
          <a href="#features" className="text-stone-600 hover:text-stone-900 font-medium transition-colors">Features</a>
          <button
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200"
          >
            Preview Access
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto text-center pt-20 pb-16 px-8 relative z-10">
        <div className="inline-flex items-center gap-3 bg-amber-50 text-amber-700 px-4 py-2 rounded-full mb-8">
          <Construction className="w-5 h-5" />
          <span className="font-medium">Launching March 2026</span>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-stone-900 leading-[1.1] tracking-tight mb-8">
          AI Voice Agents
          <span className="block text-gradient bg-gradient-to-r from-amber-500 to-amber-600">
            That Actually Work
          </span>
        </h1>
        
        <p className="text-xl text-stone-600 max-w-3xl mx-auto leading-relaxed mb-12">
          We're building the most reliable AI-powered phone agent platform. 
          Launching with enterprise-grade security and advanced features.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-200 transform hover:scale-[1.02]"
          >
            Join Waiting List
          </button>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-white border-2 border-stone-200 hover:border-stone-300 text-stone-700 font-semibold py-3 px-8 rounded-lg text-lg transition-all duration-200"
          >
            View Pricing
          </button>
        </div>
      </section>

      {/* Features Under Construction */}
      <section id="features" className="max-w-6xl mx-auto px-8 pb-24 relative z-10">
        <h2 className="text-3xl font-bold text-center text-stone-900 mb-12">
          What We're Building
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm">
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
              <PhoneOutgoing className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-stone-900 mb-4">Outbound Campaigns</h3>
            <p className="text-stone-600">
              AI-powered sales calls, lead qualification, and appointment setting at scale with natural conversations.
            </p>
            <div className="mt-6 pt-6 border-t border-stone-100">
              <span className="text-sm font-medium text-blue-600">In Development</span>
            </div>
          </div>
          
          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm">
            <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mb-6">
              <Phone className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-stone-900 mb-4">24/7 Inbound Support</h3>
            <p className="text-stone-600">
              Never miss a customer call. AI answers, captures leads, and handles FAQs around the clock.
            </p>
            <div className="mt-6 pt-6 border-t border-stone-100">
              <span className="text-sm font-medium text-emerald-600">In Development</span>
            </div>
          </div>
          
          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-8 border border-stone-200 shadow-sm">
            <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-stone-900 mb-4">Enterprise Security</h3>
            <p className="text-stone-600">
              SOC 2 compliant infrastructure, end-to-end encryption, and compliance with global data protection regulations.
            </p>
            <div className="mt-6 pt-6 border-t border-stone-100">
              <span className="text-sm font-medium text-purple-600">In Development</span>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist CTA */}
      <section className="bg-gradient-to-r from-stone-900 to-stone-800 text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-8">
          <h2 className="text-3xl font-bold mb-6">Be First to Get Access</h2>
          <p className="text-xl text-stone-300 mb-10 max-w-2xl mx-auto">
            Join our exclusive waiting list for early access, special launch pricing, and priority support.
          </p>
          
          <div className="max-w-md mx-auto">
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-3 bg-stone-800 border border-stone-700 rounded-lg text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200">
                Join List
              </button>
            </div>
            <p className="text-sm text-stone-400 mt-4">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-10 text-center text-sm text-stone-500">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                <Phone className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-stone-900">VoxReach</span>
            </div>
            
            <div className="flex gap-8">
              <a href="#" className="text-stone-600 hover:text-stone-900 transition-colors">Twitter</a>
              <a href="mailto:hello@voxreach.io" className="text-stone-600 hover:text-stone-900 transition-colors">Contact</a>
              <button onClick={() => navigate('/pricing')} className="text-stone-600 hover:text-stone-900 transition-colors">Pricing</button>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-stone-200">
            <p>© 2026 VoxReach. All rights reserved.</p>
            <p className="mt-2 text-stone-400">Building the future of AI-powered voice communication</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
