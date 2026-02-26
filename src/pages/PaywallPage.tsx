import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function PaywallPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If came back from successful checkout, recheck status and redirect
    if (searchParams.get('checkout') === 'success') {
      setTimeout(() => navigate('/chat'), 2000);
    }
  }, [searchParams, navigate]);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ return_url: `${window.location.origin}/paywall` }),
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (searchParams.get('checkout') === 'success') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌹</div>
          <h2 className="text-2xl font-bold text-green-400 mb-2">Subscription Active</h2>
          <p className="text-gray-400">Redirecting you to Rose Glass...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <div className="bg-[var(--sidebar-bg)] border-b border-[var(--border)] px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--accent-hot)]">Rose Glass</h1>
          <div className="flex items-center gap-4">
            <span className="text-[var(--text-muted)] text-xs">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 border border-[var(--border)] text-[var(--text-secondary)] rounded-lg hover:border-[var(--accent-primary)] transition-colors text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">🌹</div>
          <h2 className="text-3xl font-bold text-white mb-3">Your trial has ended</h2>
          <p className="text-gray-400 mb-8 text-lg">
            Continue building coherence with Rose Glass for $9.99/month.
          </p>

          <div className="bg-slate-800 border border-purple-500/20 rounded-2xl p-8 mb-8">
            <div className="text-5xl font-bold text-white mb-1">$9.99</div>
            <div className="text-gray-400 mb-6">per month</div>
            <ul className="text-left space-y-3 text-sm text-gray-300 mb-6">
              {[
                'Full dimensional analysis (Ψ, ρ, q, f)',
                'Unlimited translation sessions',
                'Coherence history & trajectory tracking',
                'Meta-notes across conversations',
                'All three modes: analyze, translate, reflect',
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">✦</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {error && (
              <div className="mb-4 text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded px-3 py-2">
                {error}
              </div>
            )}

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? 'Redirecting to checkout...' : 'Subscribe — $9.99/month'}
            </button>
          </div>

          <p className="text-gray-500 text-xs">
            Secure payment via Stripe. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
