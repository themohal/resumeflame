"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

function getVisitorId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem("rf_visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("rf_visitor_id", id);
  }
  return id;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visitorId, setVisitorId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setVisitorId(getVisitorId());
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "x-visitor-id": visitorId },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      router.push(`/roast/${data.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold leading-tight">
          AI Resume Reviewer &{" "}
          <span className="text-orange-500">Professional Rewriter</span>
        </h1>
        <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto">
          Upload your resume and get an instant AI-powered review with a score out of 10.
          Then unlock a professionally rewritten, ATS-optimized resume that lands interviews.
        </p>

        {/* Upload Area */}
        <div className="mt-12 max-w-lg mx-auto">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-600 rounded-xl p-10 cursor-pointer hover:border-orange-500 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div>
                <p className="text-lg font-medium text-orange-400">{file.name}</p>
                <p className="text-sm text-gray-500 mt-1">Click to change file</p>
              </div>
            ) : (
              <div>
                <p className="text-4xl mb-3">&#128196;</p>
                <p className="text-lg font-medium">Drop your resume PDF here</p>
                <p className="text-sm text-gray-500 mt-1">or click to browse</p>
              </div>
            )}
          </div>

          {error && (
            <p className="mt-4 text-red-400 text-sm">{error}</p>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="mt-6 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg"
          >
            {loading ? "Analyzing your resume..." : "Review My Resume"}
          </button>
          <p className="text-xs text-gray-500 mt-3">
            Get your AI resume score instantly. No sign-up required.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Upload Your Resume",
              desc: "Upload your resume as a PDF. Our AI parses and analyzes it instantly.",
            },
            {
              step: "2",
              title: "Get Your Score & Review",
              desc: "Receive a detailed AI review with a score out of 10, key issues, and actionable feedback.",
            },
            {
              step: "3",
              title: "Unlock Your Rewrite",
              desc: "Get a professionally rewritten, ATS-optimized resume that lands more interviews.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center"
            >
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why ResumeFlame - SEO content */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Job Seekers Choose ResumeFlame
        </h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">AI-Powered Resume Analysis</h3>
            <p className="text-gray-400 text-sm">
              Our advanced AI reviews your resume like a hiring manager would, identifying
              weak action verbs, missing metrics, and formatting issues that hurt your chances.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">ATS Keyword Optimization</h3>
            <p className="text-gray-400 text-sm">
              Over 90% of large companies use Applicant Tracking Systems. Our Pro rewrite
              ensures your resume passes ATS filters with industry-relevant keywords.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Professional Resume Rewriting</h3>
            <p className="text-gray-400 text-sm">
              Get your resume rewritten with strong action verbs, quantified achievements,
              and a professional structure that stands out to recruiters.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2">Instant Results</h3>
            <p className="text-gray-400 text-sm">
              No waiting days for feedback. Upload your resume and get a detailed AI review
              with a score, issues, and recommendations in under 30 seconds.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">Simple Pricing</h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          Choose the plan that fits your job search. Every plan includes a detailed AI resume review with score and feedback.
        </p>
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <div className="bg-gray-900 border-2 border-orange-500 rounded-xl p-6 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-xs font-bold px-3 py-1 rounded-full">
              POPULAR
            </span>
            <h3 className="text-lg font-semibold">Basic Fix</h3>
            <p className="text-3xl font-bold mt-2">$3</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-400">
              <li>&#10003; Resume score (1-10)</li>
              <li>&#10003; Detailed AI review & feedback</li>
              <li>&#10003; Key issues identified</li>
              <li>&#10003; AI-rewritten resume</li>
              <li>&#10003; Stronger action verbs</li>
              <li>&#10003; Quantified achievements</li>
              <li className="text-gray-600">&#10007; ATS optimization</li>
              <li className="text-gray-600">&#10007; Cover letter</li>
            </ul>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold">Pro Fix</h3>
            <p className="text-3xl font-bold mt-2">$5</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-400">
              <li>&#10003; Everything in Basic</li>
              <li>&#10003; ATS keyword optimization</li>
              <li>&#10003; Tailored for specific job</li>
              <li>&#10003; Formatted PDF download</li>
              <li>&#10003; Cover letter bonus</li>
              <li>&#10003; Professional summary</li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center mt-6">
          All purchases are final and non-refundable. Payments processed securely via Lemon Squeezy.
        </p>
      </section>

      {/* FAQ - SEO rich content */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">What is ResumeFlame?</h3>
            <p className="text-gray-400 text-sm">
              ResumeFlame is an AI-powered resume review and rewriting tool. It analyzes your
              resume, scores it out of 10, identifies key issues, and can rewrite it professionally
              with ATS-optimized keywords to help you land more job interviews.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">How does the AI resume review work?</h3>
            <p className="text-gray-400 text-sm">
              Upload your resume as a PDF and our AI instantly analyzes it for common issues like
              weak action verbs, lack of quantified achievements, poor formatting, and missing keywords
              that ATS systems look for.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">What is ATS optimization?</h3>
            <p className="text-gray-400 text-sm">
              ATS (Applicant Tracking System) optimization ensures your resume contains the right
              keywords and formatting so it passes automated screening software used by over 90% of
              large employers before a human ever sees your application.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">How is this different from other resume builders?</h3>
            <p className="text-gray-400 text-sm">
              Unlike template-based resume builders, ResumeFlame analyzes your existing resume and
              rewrites it with AI to be more impactful. We focus on transforming your real experience
              into achievement-focused, recruiter-friendly content.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
