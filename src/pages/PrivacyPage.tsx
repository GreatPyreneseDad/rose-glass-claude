export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: February 26, 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">What we collect</h2>
            <p>Rose Glass collects your email address and password when you create an account. We store the text you submit for analysis and the responses generated. We do not sell your data to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">How we use it</h2>
            <p>Your data is used solely to provide the Rose Glass service — generating dimensional analysis, translation, and reflection responses. Session history is stored to provide continuity across conversations.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Payment data</h2>
            <p>Payment processing is handled entirely by Stripe. Rose Glass does not store credit card numbers or banking information. We receive only subscription status from Stripe.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Data retention</h2>
            <p>Your session data is retained for as long as your account is active. You may request deletion of your data at any time by contacting us at the email below.</p>
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
