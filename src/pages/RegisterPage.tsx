import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type Plan = 'monthly' | 'annual';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<Plan>(
    searchParams.get('plan') === 'annual' ? 'annual' : 'monthly'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const startCheckout = async (plan: Plan) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          return_url: `${window.location.origin}/paywall`,
          plan,
        }),
      }
    );
    const data = await response.json();
    if (data.url) window.location.href = data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }

    setLoading(true);
    const { error } = await signUp(email, password, 'signal');

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (selectedPlan === 'annual') {
      await startCheckout('annual');
    } else {
      navigate('/chat');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-[var(--accent-hot)]">Rose Glass</Link>
        </div>

        {/* Plan Toggle */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`rounded-xl p-4 border-2 text-left transition-all ${
              selectedPlan === 'monthly'
                ? 'border-purple-500 bg-slate-800'
                : 'border-slate-700 bg-slate-900 hover:border-slate-500'
            }`}
          >
            <div className="text-xs text-gray-400 mb-0.5">Monthly</div>
            <div className="text-xl font-bold text-white">$9.99<span className="text-xs font-normal text-gray-400">/mo</span></div>
            <div className="text-purple-400 text-xs mt-1">30-day free trial</div>
          </button>

          <button
            onClick={() => setSelectedPlan('annual')}
            className={`rounded-xl p-4 border-2 text-left transition-all relative ${
              selectedPlan === 'annual'
                ? 'border-pink-500 bg-slate-800'
                : 'border-slate-700 bg-slate-900 hover:border-slate-500'
            }`}
          >
            <div className="absolute -top-2.5 right-3 bg-pink-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">SAVE $70</div>
            <div className="text-xs text-gray-400 mb-0.5">Annual</div>
            <div className="text-xl font-bold text-white">$39.99<span className="text-xs font-normal text-gray-400">/yr</span></div>
            <div className="text-pink-400 text-xs mt-1">Start today, no trial</div>
          </button>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[var(--text-secondary)] text-sm mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
            <div>
              <label className="block text-[var(--text-secondary)] text-sm mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
            <div>
              <label className="block text-[var(--text-secondary)] text-sm mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Creating Account...'
                : selectedPlan === 'annual'
                  ? 'Create Account & Subscribe — $39.99/yr'
                  : 'Start Free Trial'}
            </button>
          </form>

          <p className="text-[var(--text-muted)] text-xs text-center mt-5">
            {selectedPlan === 'annual'
              ? 'Secure payment via Stripe. Cancel anytime.'
              : 'No credit card required. Cancel anytime after trial.'}
          </p>
        </div>

        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--accent-primary)] hover:underline">Sign in</Link>
        </p>

        <p className="text-center text-xs text-[var(--text-muted)] mt-8">
          ROSE Corp. — Service-Disabled Veteran-Owned Small Business
        </p>
      </div>
    </div>
  );
}
