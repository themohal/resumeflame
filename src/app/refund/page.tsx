export default function Refund() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-8">Refund Policy</h1>
      <div className="prose prose-invert prose-gray max-w-none space-y-4 text-gray-300 text-sm leading-relaxed">
        <p><strong>Effective Date:</strong> February 2026</p>

        <h2 className="text-xl font-semibold text-white mt-6">Refund Eligibility</h2>
        <p>
          We offer a <strong>7-day refund policy</strong> on all purchases. If you are
          not satisfied with your AI-generated resume rewrite, you may request a full
          refund within 7 days of purchase.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">How to Request a Refund</h2>
        <p>
          To request a refund, contact us at <strong>support@resumeflame.com</strong> with
          your purchase details. Refunds are processed within 5-10 business days through
          Paddle, our payment processor.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">Exceptions</h2>
        <p>
          Refunds may be denied if we detect abuse of the refund policy (e.g., repeated
          purchases and refund requests for the same service).
        </p>
      </div>
    </main>
  );
}
