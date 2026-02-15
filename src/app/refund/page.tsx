export default function Refund() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-8">Refund Policy</h1>
      <div className="prose prose-invert prose-gray max-w-none space-y-4 text-gray-300 text-sm leading-relaxed">
        <p><strong>Effective Date:</strong> February 2026</p>

        <h2 className="text-xl font-semibold text-white mt-6">All Sales Are Final — No Refunds</h2>
        <p>
          All purchases on ResumeFlame are <strong>final and non-refundable</strong>.
          ResumeFlame provides a fully digital, AI-generated product that is created and
          delivered instantly upon payment. Because the service is fully performed and the
          digital product is delivered within seconds of purchase, no refunds, returns,
          credits, exchanges, or chargebacks will be honored under any circumstances.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">Instant Digital Delivery Consent</h2>
        <p>
          By clicking the purchase button and completing payment, you:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Expressly request immediate performance and delivery of the digital product</li>
          <li>Acknowledge that the product is AI-generated and delivered instantly</li>
          <li>Waive any right of withdrawal, cooling-off period, or cancellation</li>
          <li>Accept that the service is fully performed upon delivery of results</li>
          <li>Agree that no refund is owed or will be issued for any reason</li>
        </ul>
        <p>
          This consent is given in accordance with EU Consumer Rights Directive Article 16(m)
          and equivalent international consumer protection frameworks governing digital content
          delivered with prior express consent.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">What This Policy Covers</h2>
        <p>This no-refund policy applies to all scenarios without exception, including:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Dissatisfaction with AI-generated results or quality of output</li>
          <li>Subjective preferences about content, style, or formatting</li>
          <li>Accidental or unintended purchases</li>
          <li>Duplicate purchases</li>
          <li>Purchasing the wrong plan (Basic vs. Pro)</li>
          <li>Change of mind after purchase</li>
          <li>Inability to download, copy, or use the delivered content</li>
          <li>Expectations not being met</li>
          <li>Any other reason not listed above</li>
        </ul>

        <h2 className="text-xl font-semibold text-white mt-6">Proof of Delivery</h2>
        <p>
          ResumeFlame maintains comprehensive server-side logs that confirm product delivery,
          including: timestamps of payment confirmation, timestamps of when AI processing began
          and completed, confirmation that results were saved and made available to the user,
          and records of when the user accessed the results page. These logs constitute
          definitive proof of delivery and will be provided to Lemon Squeezy and financial
          institutions in the event of any dispute.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">Chargebacks &amp; Payment Disputes</h2>
        <p>
          Initiating a chargeback, payment reversal, or dispute with your bank, credit card
          issuer, or payment provider after the digital product has been successfully delivered
          constitutes a <strong>breach of our Terms of Service</strong> and may be considered
          fraudulent activity under applicable law.
        </p>
        <p>
          ResumeFlame will contest every chargeback on a delivered product by providing
          complete delivery evidence to Lemon Squeezy and the relevant financial institutions.
          We maintain a 100% response rate to all disputes with full documentation. Filing a
          fraudulent chargeback after receiving the product may result in:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Your information being reported to fraud prevention databases</li>
          <li>Permanent ban from using ResumeFlame services</li>
          <li>Legal action to recover the disputed amount plus associated costs</li>
        </ul>
        <p>
          <strong>If you have a genuine issue:</strong> Contact us at <strong>support@resumeflame.com</strong> before
          filing any dispute. We will investigate and resolve legitimate technical delivery
          failures by re-delivering the product.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">Payment Processor</h2>
        <p>
          All payments are processed by <strong>Lemon Squeezy</strong>, which serves as our
          Merchant of Record and handles all payment processing, tax collection, and regulatory
          compliance. Lemon Squeezy is the entity that charges your payment method.
          Any payment-related inquiries are subject to both this Refund Policy and
          {" "}<a href="https://www.lemonsqueezy.com/terms" className="text-orange-400 underline" target="_blank" rel="noopener noreferrer">Lemon Squeezy&apos;s Terms of Service</a>.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">Before You Purchase</h2>
        <p>
          We strongly encourage you to carefully review the service description, plan features,
          pricing, this Refund Policy, and our <a href="/terms" className="text-orange-400 underline">Terms of Service</a> before
          making any purchase. All information about what you will receive is clearly displayed
          on the checkout page, including the AI-generated nature of the product. By completing
          payment, you confirm that you understand and accept this no-refund policy in full.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">Dispute Resolution</h2>
        <p>
          Any disputes related to payments, refunds, or the service are subject to the binding
          arbitration clause and waiver of legal proceedings outlined in
          our <a href="/terms" className="text-orange-400 underline">Terms of Service</a>. You
          waive any right to bring legal action in any court, tribunal, or regulatory body in
          any jurisdiction worldwide regarding refunds, payment disputes, or the quality of
          AI-generated content. All disputes must be resolved through binding individual
          arbitration.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">Technical Issues</h2>
        <p>
          If a verified technical error on our end prevents delivery of the product you paid
          for, contact us at <strong>support@resumeflame.com</strong> and we will make every
          effort to resolve the issue and deliver your results. Technical support and
          re-delivery do not constitute eligibility for a monetary refund.
        </p>
      </div>
    </main>
  );
}
