export default function Privacy() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-invert prose-gray max-w-none space-y-4 text-gray-300 text-sm leading-relaxed">
        <p><strong>Effective Date:</strong> February 2026</p>
        <p>
          This Privacy Policy describes how ResumeFlame collects, uses, stores, and deletes
          your information. By using the service, you agree to this policy in its entirety.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">1. Information We Collect</h2>
        <p>We collect only the minimum information necessary to deliver the service:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Resume content</strong> — text extracted from your uploaded PDF, used solely
          for AI processing. This data is permanently deleted from our servers immediately
          after your results are delivered.</li>
          <li><strong>Anonymous visitor identifier</strong> — a random ID stored in your browser&apos;s
          local storage for session management. This is not personally identifiable.</li>
          <li><strong>Payment information</strong> — processed entirely by Lemon Squeezy (our Merchant
          of Record). We never receive, see, store, or have access to your credit card number,
          billing address, or financial details.</li>
          <li><strong>Delivery logs</strong> — timestamps and transaction identifiers confirming that
          your product was generated and delivered. These are retained for dispute resolution
          and accounting purposes.</li>
        </ul>

        <h2 className="text-xl font-semibold text-white mt-6">2. How We Use Your Data</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>To analyze your resume and generate AI-powered feedback and rewrites</li>
          <li>To deliver the purchased digital product to you</li>
          <li>To process and verify payment transactions via Lemon Squeezy</li>
          <li>To maintain delivery logs as proof of service fulfillment</li>
          <li>To respond to support inquiries and resolve disputes</li>
        </ul>
        <p>
          We do <strong>not</strong> use your data for marketing, advertising, profiling,
          training AI models, or any purpose beyond delivering the service you paid for.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">3. Third-Party Services</h2>
        <p>We use the following third-party services to operate:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>OpenAI</strong> — Your extracted resume text is sent to OpenAI&apos;s API for
          AI processing. OpenAI&apos;s API data usage policies apply. As of our integration,
          OpenAI does not use API inputs to train their models.</li>
          <li><strong>Lemon Squeezy</strong> — Handles all payment processing as Merchant of Record.
          Subject to <a href="https://www.lemonsqueezy.com/privacy" className="text-orange-400 underline" target="_blank" rel="noopener noreferrer">Lemon Squeezy&apos;s Privacy Policy</a>.</li>
          <li><strong>Supabase</strong> — Secure database hosting for temporary data storage during
          processing. Data is encrypted at rest and in transit.</li>
          <li><strong>Vercel</strong> — Web hosting and serverless function execution.</li>
        </ul>
        <p>
          We do not share your resume content with any other third parties, advertisers,
          data brokers, or external services beyond those listed above.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">4. Data Retention &amp; Deletion</h2>
        <p>
          <strong>Resume content:</strong> Permanently deleted from our database immediately after
          processing is complete and results are delivered. This happens automatically — no user
          action is required. We do not retain copies of your resume in any form.
        </p>
        <p>
          <strong>AI-generated results:</strong> Your score, feedback, and rewritten resume are
          stored temporarily to allow you to access and download your results. These are
          automatically deleted after 7 days.
        </p>
        <p>
          <strong>Payment and delivery records:</strong> Transaction identifiers, timestamps, and
          delivery confirmation logs are retained for accounting, tax compliance, and dispute
          resolution purposes as required by applicable law and Lemon Squeezy&apos;s Merchant of
          Record obligations.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">5. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your data,
          including: encryption in transit (HTTPS/TLS), encryption at rest for database storage,
          secure server-side processing with no client-side exposure of raw resume data, and
          immediate deletion of sensitive content after processing. However, no method of
          transmission or storage is 100% secure, and we cannot guarantee absolute security.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">6. Cookies &amp; Tracking</h2>
        <p>
          ResumeFlame does <strong>not</strong> use cookies, third-party analytics, tracking pixels,
          or any form of behavioral tracking. The only client-side storage used is a randomly
          generated visitor ID in your browser&apos;s local storage for session management.
          This ID cannot identify you personally and is not shared with any third party.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">7. Children&apos;s Privacy</h2>
        <p>
          ResumeFlame is not intended for users under 18 years of age. We do not knowingly
          collect information from minors. If we learn that we have collected data from a
          user under 18, we will delete it immediately.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">8. Your Rights</h2>
        <p>
          Depending on your jurisdiction, you may have rights regarding your personal data,
          including the right to access, correction, deletion, or data portability. Since we
          permanently delete your resume content immediately after processing, most data
          rights are automatically fulfilled. For any data-related requests, contact us
          at <strong>support@resumeflame.com</strong>.
        </p>
        <p>
          Please note that exercising data rights does not entitle you to a refund, as the
          digital product has already been delivered. See our <a href="/refund" className="text-orange-400 underline">Refund Policy</a> and
          {" "}<a href="/terms" className="text-orange-400 underline">Terms of Service</a> for details.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">9. International Data Transfers</h2>
        <p>
          Your data may be processed in countries other than your country of residence,
          including the United States, where our third-party service providers operate.
          By using the service, you consent to the transfer and processing of your data
          in these jurisdictions in accordance with this Privacy Policy.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">10. Compliance</h2>
        <p>
          This Privacy Policy is designed to comply with applicable data protection regulations
          including GDPR (EU), CCPA (California), and other relevant privacy frameworks. Our
          practice of immediate data deletion after processing exceeds the requirements of most
          privacy regulations.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">11. Dispute Resolution</h2>
        <p>
          Any disputes related to privacy or data handling are subject to the binding arbitration
          clause and waiver of legal proceedings outlined in our <a href="/terms" className="text-orange-400 underline">Terms of Service</a>.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">12. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Changes will be posted on this
          page with an updated effective date. Continued use of the service after changes
          constitutes acceptance of the updated policy.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">13. Contact</h2>
        <p>
          For privacy-related questions or data requests, contact us
          at <strong>support@resumeflame.com</strong>.
        </p>
      </div>
    </main>
  );
}
