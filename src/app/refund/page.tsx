export default function Refund() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-8">Refund Policy</h1>
      <div className="prose prose-invert prose-gray max-w-none space-y-4 text-gray-300 text-sm leading-relaxed">
        <p><strong>Effective Date:</strong> February 2026</p>

        <h2 className="text-xl font-semibold text-white mt-6">All Sales Are Final — No Refunds</h2>
        <p>
          All purchases on ResumeFlame are <strong>final and non-refundable</strong>.
          Because our service delivers a fully digital, AI-generated product instantly
          upon payment, no refunds, returns, credits, or exchanges will be issued once
          a transaction has been completed.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">Instant Digital Delivery</h2>
        <p>
          When you purchase a resume review and rewrite, our AI begins processing your
          resume immediately and delivers results within seconds. By completing payment,
          you expressly consent to immediate delivery and acknowledge that you waive any
          right to a cooling-off period or withdrawal once processing has begun.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">What This Policy Covers</h2>
        <p>This no-refund policy applies to all scenarios, including but not limited to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Dissatisfaction with AI-generated results or quality of output</li>
          <li>Accidental or duplicate purchases</li>
          <li>Change of mind after purchase</li>
          <li>Inability to use the delivered content for any reason</li>
          <li>Purchasing the wrong plan (Basic vs. Pro)</li>
        </ul>

        <h2 className="text-xl font-semibold text-white mt-6">Chargebacks &amp; Payment Disputes</h2>
        <p>
          Filing a chargeback or payment dispute with your bank or credit card provider after
          successfully receiving the digital product is considered a breach of these terms.
          ResumeFlame maintains detailed logs of all deliveries, including timestamps and
          content delivery confirmation. This evidence will be provided to Lemon Squeezy
          and the relevant financial institution in the event of any dispute.
        </p>
        <p>
          If you believe there has been a genuine billing error or technical failure that
          prevented delivery, please contact us <strong>before</strong> filing a dispute
          so we can investigate and resolve the issue directly.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">Payment Processor</h2>
        <p>
          All payments are handled by <strong>Lemon Squeezy</strong>, which serves as our
          Merchant of Record. Lemon Squeezy processes all transactions and manages billing
          on our behalf. Any payment-related inquiries are subject to both this policy and
          Lemon Squeezy&apos;s terms of service.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">Before You Purchase</h2>
        <p>
          We encourage you to carefully review the service description, pricing, plan features,
          and this refund policy before making a purchase. All information about what you will
          receive is clearly displayed on the checkout page. By completing payment, you confirm
          that you understand and accept this no-refund policy in full.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">Technical Issues</h2>
        <p>
          If a technical error on our end prevents delivery of the product you paid for, contact
          us at <strong>support@resumeflame.com</strong> and we will make every effort to resolve
          the issue and deliver your results. Technical support inquiries do not constitute
          eligibility for a monetary refund.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">No Legal Claims</h2>
        <p>
          By completing a purchase, you agree that any dispute related to payments, refunds, or
          the service shall be resolved exclusively through binding arbitration as outlined in
          our <a href="/terms" className="text-orange-400 underline">Terms of Service</a>. You
          waive any right to bring legal action in any court or jurisdiction worldwide regarding
          refunds, payment disputes, or the quality of AI-generated content.
        </p>
      </div>
    </main>
  );
}
