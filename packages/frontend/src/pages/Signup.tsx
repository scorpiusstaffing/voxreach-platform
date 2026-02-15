import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedIntent = searchParams.get('intent') || '';

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
    intent: preselectedIntent || 'outbound',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0E17] px-4 py-12 relative overflow-hidden">
      {/* Ambient Glow Background */}
      <div className="absolute inset-0 bg-glow-radial pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="flex items-center justify-center gap-2 text-2xl font-bold text-white tracking-tight">
            Voxreach
            <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_12px_rgba(0,180,216,0.8)]"></div>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-white">Create your account</h1>
          <p className="mt-1 text-[#9CA3AF]">Get your AI voice agents running in minutes</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#161B22] rounded-2xl border border-[#21262D] p-8 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#E5E7EB] mb-1.5">Your name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0D1117] border border-[#21262D] rounded-lg text-white placeholder:text-[#6B7280] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#E5E7EB] mb-1.5">Business name</label>
            <input
              type="text"
              value={form.organizationName}
              onChange={(e) => update('organizationName', e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0D1117] border border-[#21262D] rounded-lg text-white placeholder:text-[#6B7280] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#E5E7EB] mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0D1117] border border-[#21262D] rounded-lg text-white placeholder:text-[#6B7280] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#E5E7EB] mb-1.5">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0D1117] border border-[#21262D] rounded-lg text-white placeholder:text-[#6B7280] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
              minLength={8}
              required
            />
          </div>

          {/* Intent Selection */}
          <div>
            <label className="block text-sm font-medium text-[#E5E7EB] mb-3">What do you need?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => update('intent', 'outbound')}
                className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                  form.intent === 'outbound'
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                    : 'bg-[#0D1117] border-[#21262D] text-[#9CA3AF] hover:border-[#00B4D8]/30'
                }`}
              >
                Outbound Sales
              </button>
              <button
                type="button"
                onClick={() => update('intent', 'inbound')}
                className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                  form.intent === 'inbound'
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                    : 'bg-[#0D1117] border-[#21262D] text-[#9CA3AF] hover:border-[#00B4D8]/30'
                }`}
              >
                Inbound Reception
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-cyan py-2.5 font-medium disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-[#6B7280]">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-400 font-medium hover:text-cyan-300 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
