import { Link } from 'react-router-dom';

export default function LandingPage() {
  const scrollToDemo = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20 max-w-5xl">
        <div className="text-center space-y-8">
          <h1 className="text-6xl md:text-7xl font-bold text-[var(--text-primary)] leading-tight">
            See what's actually there.
          </h1>
          <p className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-3xl mx-auto font-light">
            Rose Glass translates the architecture of human communication. Not what people say.
            What the signal underneath actually contains.
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            30-day free trial · $9.99/month · Cancel anytime
          </p>
          <div className="flex gap-4 justify-center items-center flex-wrap">
            <Link
              to="/register"
              className="px-8 py-4 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-hot)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-lg"
            >
              Start Free Trial
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-transparent border-2 border-[var(--accent-primary)] text-[var(--accent-primary)] font-semibold rounded-lg hover:bg-[var(--accent-primary)]/10 transition-colors text-lg"
            >
              Sign In
            </Link>
            <button
              onClick={scrollToDemo}
              className="px-8 py-4 border border-[var(--border)] text-[var(--text-secondary)] font-medium rounded-lg hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)] transition-colors text-lg"
            >
              See how it works
            </button>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="container mx-auto px-6 py-20 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Panel 1 - PASTE */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-8 space-y-4">
            <h3 className="text-2xl font-bold text-[var(--accent-hot)]">PASTE</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Drop a conversation, a message, an exchange. Anything where you felt the signal
              didn't match the words.
            </p>
          </div>

          {/* Panel 2 - TRANSLATE */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-8 space-y-4">
            <h3 className="text-2xl font-bold text-[var(--accent-hot)]">TRANSLATE</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Rose Glass reads internal consistency, emotional activation, distortion patterns,
              and belonging architecture. Returns what's mathematically present — not what you
              hoped was there.
            </p>
          </div>

          {/* Panel 3 - SEE */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-8 space-y-4">
            <h3 className="text-2xl font-bold text-[var(--accent-hot)]">SEE</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Plain language. No jargon required. The framework works whether you understand
              the equations or not.
            </p>
          </div>
        </div>
      </div>

      {/* Command Reference Section */}
      <div className="container mx-auto px-6 py-20 max-w-4xl">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-8 text-center">
          How to talk to Rose Glass
        </h2>
        <div className="space-y-6">
          {/* /analyze */}
          <div className="bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg p-6">
            <div className="font-mono text-[var(--accent-primary)] text-lg mb-3">/analyze</div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Full dimensional output. Ψ, ρ, q, f scores. Distortion mapping. Mathematical precision.
              <br />
              <span className="text-[var(--text-muted)] text-sm">Use when you want to see everything.</span>
            </p>
          </div>

          {/* /translate */}
          <div className="bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg p-6">
            <div className="font-mono text-[var(--accent-primary)] text-lg mb-3">/translate</div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Clean language only. No metrics. Just what the framework sees, in plain human terms.
              <br />
              <span className="text-[var(--text-muted)] text-sm">Use when you want to know what to do next.</span>
            </p>
          </div>

          {/* /reflect */}
          <div className="bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-lg p-6">
            <div className="font-mono text-[var(--accent-primary)] text-lg mb-3">/reflect</div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Conversation mode. Rose Glass informs the response but doesn't display the framework.
              <br />
              <span className="text-[var(--text-muted)] text-sm">Use when you need to think out loud.</span>
            </p>
          </div>

          <p className="text-[var(--text-muted)] text-sm text-center pt-4">
            Default mode (no command): /analyze
          </p>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="container mx-auto px-6 py-20 max-w-lg text-center">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-3">Simple pricing</h2>
        <p className="text-[var(--text-secondary)] mb-10">Start free. No card required for trial.</p>
        <div className="bg-slate-800 border border-purple-500/20 rounded-2xl p-10">
          <div className="text-5xl font-bold text-white mb-1">$9.99</div>
          <div className="text-gray-400 mb-2">per month</div>
          <div className="text-purple-400 text-sm mb-8">30-day free trial to start</div>
          <ul className="text-left space-y-3 text-sm text-gray-300 mb-8">
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
          <Link
            to="/register"
            className="block w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 text-lg"
          >
            Start Free Trial
          </Link>
          <p className="text-gray-500 text-xs mt-4">Cancel anytime. No commitment.</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--sidebar-bg)] py-12 mt-20">
        <div className="container mx-auto px-6 max-w-4xl text-center space-y-3">
          <div className="text-[var(--text-primary)] font-semibold">
            ROSE Corp. — Recognition Of Synthetic-organic Expression
          </div>
          <div className="text-[var(--text-muted)] text-sm">
            MacGregor Holding Company | Jackson Hole, Wyoming
          </div>
          <div className="text-[var(--text-muted)] text-sm">
            Service-Disabled Veteran-Owned Small Business
          </div>
          <div className="text-[var(--text-secondary)] italic pt-4">
            "On a long enough timeline, distortion goes to zero."
          </div>
        </div>
      </footer>
    </div>
  );
}
