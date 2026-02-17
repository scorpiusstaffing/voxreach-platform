import React from 'react';
import { Construction, Mail, Clock, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UnderConstruction() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 to-stone-800 text-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-amber-500/20 rounded-full mb-6">
            <Construction className="w-12 h-12 text-amber-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            VoxReach is Under Construction
          </h1>
          <p className="text-xl text-stone-300 max-w-2xl mx-auto">
            We're building something amazing! Our platform is currently being upgraded with enhanced security and new features.
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-stone-800/50 backdrop-blur-sm rounded-2xl p-8 md:p-12 mb-12 border border-stone-700/50">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Shield className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Enhanced Security</h3>
                  <p className="text-stone-300">
                    We're implementing enterprise-grade security measures to protect your data and ensure compliance.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Clock className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Estimated Launch</h3>
                  <p className="text-stone-300">
                    We expect to be fully operational within the next 2-3 weeks. Stay tuned for updates!
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Mail className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Get Notified</h3>
                  <p className="text-stone-300">
                    Join our waiting list to be the first to know when we launch and get early access.
                  </p>
                </div>
              </div>
              
              <div className="bg-stone-900/50 rounded-xl p-6 border border-stone-700">
                <h4 className="font-semibold mb-3 text-lg">What's Coming</h4>
                <ul className="space-y-2 text-stone-300">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    Advanced AI voice agents
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    Multi-channel campaign management
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    Enterprise security features
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                    Real-time analytics dashboard
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Waitlist Form */}
          <div className="bg-stone-900/30 rounded-xl p-8 border border-stone-700">
            <h3 className="text-2xl font-bold mb-4 text-center">Join Our Waiting List</h3>
            <p className="text-stone-300 text-center mb-8 max-w-lg mx-auto">
              Be the first to get access when we launch. We'll send you exclusive early-bird offers.
            </p>
            
            <form className="max-w-md mx-auto space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Your email address"
                  className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-lg text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Your name (optional)"
                  className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-lg text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Join Waiting List
              </button>
            </form>
            
            <p className="text-sm text-stone-400 text-center mt-6">
              We respect your privacy. No spam, ever.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-4">
          <div className="flex justify-center space-x-6">
            <a 
              href="https://twitter.com/voxreach" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-stone-400 hover:text-white transition-colors"
            >
              Twitter
            </a>
            <a 
              href="mailto:hello@voxreach.io" 
              className="text-stone-400 hover:text-white transition-colors"
            >
              Contact Us
            </a>
            <Link 
              to="/pricing" 
              className="text-stone-400 hover:text-white transition-colors"
            >
              Pricing
            </Link>
          </div>
          
          <div className="pt-6 border-t border-stone-700/50">
            <p className="text-stone-500">
              © {new Date().getFullYear()} VoxReach. All rights reserved.
            </p>
            <p className="text-sm text-stone-600 mt-2">
              Building the future of AI-powered voice communication
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}