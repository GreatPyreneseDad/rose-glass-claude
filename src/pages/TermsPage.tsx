export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: February 26, 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Acceptance</h2>
            <p>By creating an account and using Rose Glass, you agree to these terms. If you do not agree, do not use the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Service description</h2>
            <p>Rose Glass is a subscription-based AI communication analysis tool. We provide dimensional analysis, translation, and reflection of human communication patterns using the Rose Glass framework.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Subscriptions and billing</h2>
            <p>Rose Glass offers a 30-day free trial followed by a $9.99/month subscription, or an annual subscription at $39.99/year. Billing is handled by Stripe. You may cancel at any time. No refunds are issued for partial billing periods.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Acceptable use</h2>
            <p>You agree not to use Rose Glass to generate harmful, illegal, or abusive content. You agree not to attempt to reverse-engineer the underlying framework or resell access to the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Limitation of liability</h2>
            <p>Rose Glass is provided as-is. MacGregor Holding Company is not liable for decisions made based on outputs from the service. The framework is a translation tool, not a licensed clinical or legal service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
            <p>MacGregor Holding Company | Jackson Hole, Wyoming<br />
            <a href="mailto:cherryandcammy@protonmail.com" className="text-purple-400 hover:underline">cherryandcammy@protonmail.com</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
