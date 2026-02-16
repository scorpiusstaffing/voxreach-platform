import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100 px-4 relative overflow-hidden">
      {/* Soft Gradient Orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-100/50 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="flex items-center justify-center">
            <img src="/assets/logo-large.svg" alt="Voxreach" className="h-10 w-auto" />
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-stone-900">Welcome back</h1>
          <p className="mt-1 text-stone-500">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 shadow-xl p-8 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-2.5 font-medium rounded-lg shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-stone-500">
          Don't have an account?{' '}
          <Link to="/signup" className="text-amber-600 font-medium hover:text-amber-700 transition-colors">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
