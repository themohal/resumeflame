export default function Privacy() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-invert prose-gray max-w-none space-y-4 text-gray-300 text-sm leading-relaxed">
        <p><strong>Effective Date:</strong> February 2026</p>

        <h2 className="text-xl font-semibold text-white mt-6">1. Information We Collect</h2>
        <p>
          We collect the following information when you use ResumeFlame:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Resume content (text extracted from uploaded PDFs)</li>
          <li>A random visitor identifier stored in your browser</li>
          <li>Payment information (processed by Paddle — we never see your card details)</li>
        </ul>

        <h2 className="text-xl font-semibold text-white mt-6">2. How We Use Your Data</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>To analyze and provide feedback on your resume</li>
          <li>To generate AI-powered resume rewrites</li>
          <li>To track free usage limits (one free roast per visitor)</li>
          <li>To process payments and deliver purchased products</li>
        </ul>

        <h2 className="text-xl font-semibold text-white mt-6">3. Data Storage</h2>
        <p>
          Resume data is stored securely in our database hosted on Supabase.
          We do not sell or share your resume content with third parties.
          Resume text is sent to OpenAI for analysis — their data processing terms apply.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">4. Data Retention</h2>
        <p>
          Resume data is retained for 30 days to allow you to access your results,
          after which it is automatically deleted.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">5. Cookies</h2>
        <p>
          We use a local storage identifier to track free usage. We do not use
          tracking cookies or third-party analytics.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">6. Your Rights</h2>
        <p>
          You may request deletion of your data at any time by contacting
          support@resumeflame.com.
        </p>

        <h2 className="text-xl font-semibold text-white mt-6">7. Contact</h2>
        <p>
          For privacy-related questions, contact us at support@resumeflame.com.
        </p>
      </div>
    </main>
  );
}
