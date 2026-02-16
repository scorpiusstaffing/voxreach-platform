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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 px-4 py-12 relative overflow-hidden">
      {/* Ambient Glow Background */}
      <div className="absolute inset-0 bg-glow-radial pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="flex items-center justify-center gap-2 text-2xl font-bold text-stone-900 tracking-tight">
            Voxreach
            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]"></div>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-stone-900">Create your account</h1>
          <p className="mt-1 text-stone-500">Get your AI voice agents running in minutes</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-8 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Your name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Business name</label>
            <input
              type="text"
              value={form.organizationName}
              onChange={(e) => update('organizationName', e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
              minLength={8}
              required
            />
          </div>

          {/* Intent Selection */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-3">What do you need?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => update('intent', 'outbound')}
                className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                  form.intent === 'outbound'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-600'
                    : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-amber-500/30'
                }`}
              >
                Outbound Sales
              </button>
              <button
                type="button"
                onClick={() => update('intent', 'inbound')}
                className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                  form.intent === 'inbound'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-600'
                    : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-amber-500/30'
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

        <p className="text-center mt-6 text-sm text-stone-500">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-600 font-medium hover:text-amber-700 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
