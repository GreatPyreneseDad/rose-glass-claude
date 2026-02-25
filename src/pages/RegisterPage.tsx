import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Plan = 'SIGNAL' | 'COHERENCE' | 'JADE';

export default function RegisterPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>('COHERENCE');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
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

    // For now, just route to chat
    // In production, this would create account and handle payment
    navigate('/chat');
  };

  const plans = [
    {
      name: 'SIGNAL' as Plan,
      price: 12,
      features: [
        '100 analyses per month',
        '/translate and /reflect modes',
        'Session history (7 days)',
      ],
    },
    {
      name: 'COHERENCE' as Plan,
      price: 29,
      features: [
        'Unlimited analyses',
        'All modes',
        'Session continuity (30 days)',
        'Priority processing',
      ],
    },
    {
      name: 'JADE' as Plan,
      price: 97,
      features: [
        'Everything in Coherence',
        'API access',
        'Session memory across conversations',
        'Export dimensional reports',
        'Early access to new calibrations',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-12 px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">Begin Translation</h1>
          <p className="text-[var(--text-secondary)]">
            Select your plan and create your account
          </p>
        </div>

        {/* Plan Selection */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => (
            <button
              key={plan.name}
              onClick={() => setSelectedPlan(plan.name)}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                selectedPlan === plan.name
                  ? 'border-[var(--accent-primary)] bg-[var(--bg-secondary)]'
                  : 'border-[var(--border)] bg-[var(--sidebar-bg)] hover:border-[var(--accent-primary)]/50'
              }`}
            >
              <div className="mb-4">
                <div className="text-2xl font-bold text-[var(--accent-hot)]">{plan.name}</div>
                <div className="text-3xl font-bold text-[var(--text-primary)] mt-2">
                  ${plan.price}
                  <span className="text-sm text-[var(--text-muted)] font-normal">/month</span>
                </div>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="text-[var(--text-secondary)] text-sm flex items-start">
                    <span className="text-[var(--accent-primary)] mr-2">•</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {/* Registration Form */}
        <div className="max-w-md mx-auto">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[var(--text-secondary)] text-sm mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] text-sm mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] text-sm mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                className="w-full py-3 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-hot)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Begin Translation
              </button>
            </form>
          </div>

          <div className="mt-8 text-center text-sm text-[var(--text-muted)] leading-relaxed">
            ROSE Corp. is a Service-Disabled Veteran-Owned Small Business. Your subscription funds
            continued development of translation infrastructure for AI-human communication.
          </div>
        </div>
      </div>
    </div>
  );
}
