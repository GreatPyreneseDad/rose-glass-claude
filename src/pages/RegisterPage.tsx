import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, 'signal');
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-[var(--accent-hot)]">Rose Glass</Link>
          <p className="text-[var(--text-secondary)] mt-2">30-day free trial · then $9.99/month</p>
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
              {loading ? 'Creating Account...' : 'Start Free Trial'}
            </button>
          </form>

          <p className="text-[var(--text-muted)] text-xs text-center mt-5">
            No credit card required. Cancel anytime after trial.
          </p>
        </div>

        <p className="text-center text-sm text-[var(--text-muted)] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[var(--accent-primary)] hover:underline">Sign in</Link>
        </p>

        <p className="text-center text-xs text-[var(--text-muted)] mt-8 leading-relaxed">
          ROSE Corp. — Service-Disabled Veteran-Owned Small Business
        </p>
      </div>
    </div>
  );
}
