"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";

interface RoastData {
  score: number;
  roast_lines: string[];
  issues: string[];
  one_liner: string;
}

interface ResumeData {
  id: string;
  score: number | null;
  roast: string | null;
  fix: string | null;
  paid: boolean;
  tier: string;
  processing_error: string | null;
}

export default function RoastPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [resume, setResume] = useState<ResumeData | null>(null);
  const [roast, setRoast] = useState<RoastData | null>(null);
  const [fix, setFix] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const lemonLoaded = useRef(false);
  const paymentConfirmed = useRef(false);
  const pollFailCount = useRef(0);

  const returningFromPayment = searchParams.get("paid") === "1";

  // Load Lemon Squeezy JS
  useEffect(() => {
    if (lemonLoaded.current) return;
    lemonLoaded.current = true;
    const script = document.createElement("script");
    script.src = "https://assets.lemonsqueezy.com/lemon.js";
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  // Poll for resume data
  const fetchResume = useCallback(async () => {
    try {
      const res = await fetch(`/api/roast?id=${id}`);
      if (!res.ok) {
        pollFailCount.current++;
        // Stop polling after 15 consecutive failures (30 seconds)
        if (pollFailCount.current >= 15) {
          setError("Resume not found. It may have been deleted or the link is invalid.");
          setLoading(false);
        }
        return;
      }
      pollFailCount.current = 0;
      const data = await res.json();

      if (data.resume) {
        setResume(data.resume);
        if (data.resume.roast) {
          try {
            setRoast(JSON.parse(data.resume.roast));
            setProcessing(false);
          } catch {
            // Invalid JSON
          }
        }
        if (data.resume.fix) {
          setFix(data.resume.fix);
        }
        if (data.resume.processing_error) {
          setProcessing(false);
        }
        setLoading(false);
      }
    } catch {
      pollFailCount.current++;
      if (pollFailCount.current >= 15) {
        setError("Unable to reach server. Please check your connection.");
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    fetchResume();
    const interval = setInterval(fetchResume, 2000);
    return () => clearInterval(interval);
  }, [fetchResume]);

  const confirmPayment = useCallback(async (tier: string) => {
    console.log("Confirming payment for:", id, tier);
    setProcessing(true);
    setError("");
    setResume((prev) => prev ? { ...prev, paid: true } : prev);

    try {
      const res = await fetch("/api/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: id, tier }),
      });
      const data = await res.json();
      console.log("Confirm payment response:", data);

      if (!res.ok) {
        setProcessing(false);
        setError(data.error || "Something went wrong while processing your resume. Please try again.");
      }
    } catch (err) {
      console.error("Confirm payment error:", err);
      setProcessing(false);
      setError("Something went wrong while processing your resume. Please try again.");
    }
  }, [id]);

  // Detect redirect back from Lemon Squeezy
  useEffect(() => {
    if (paymentConfirmed.current) return;
    const paidParam = searchParams.get("paid");
    const tierParam = searchParams.get("tier");
    if (paidParam === "1") {
      paymentConfirmed.current = true;
      setProcessing(true);
      confirmPayment(tierParam || "basic");
      window.history.replaceState({}, "", `/roast/${id}`);
    }
  }, [searchParams, confirmPayment, id]);

  // Listen for Lemon Squeezy overlay checkout events
  useEffect(() => {
    function handleLSEvent(event: MessageEvent) {
      if (typeof event.data !== "string") return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === "Checkout.Success") {
          const customData = data.data?.order?.meta?.custom_data;
          const tier = customData?.tier || "basic";
          confirmPayment(tier);
        }
      } catch {
        // Not a JSON message
      }
    }
    window.addEventListener("message", handleLSEvent);
    return () => window.removeEventListener("message", handleLSEvent);
  }, [confirmPayment]);

  const handlePayment = async (tier: "basic" | "pro") => {
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: id, tier }),
      });
      const data = await res.json();

      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Failed to create checkout");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      if (win.createLemonSqueezy) win.createLemonSqueezy();

      if (win.LemonSqueezy?.Url) {
        win.LemonSqueezy.Url.Open(data.checkoutUrl);
      } else {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Payment system failed to load. Please refresh and try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!fix) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Resume - ResumeFlame</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      color: #1a1a1a;
      font-size: 12pt;
    }
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: inherit;
      margin: 0;
    }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <pre>${fix.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
    setDownloaded(true);
  };

  // --- RENDER STATES ---

  // Returning from payment + still loading initial data
  if (loading && returningFromPayment) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="animate-pulse">
          <p className="text-4xl mb-4">&#128293;</p>
          <h1 className="text-2xl font-bold">Analyzing your resume...</h1>
          <p className="text-gray-400 mt-2">Payment confirmed! Generating your results — this takes about 15-30 seconds.</p>
        </div>
      </main>
    );
  }

  // Initial loading
  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="animate-pulse">
          <p className="text-4xl mb-4">&#128196;</p>
          <h1 className="text-2xl font-bold">Loading...</h1>
          <p className="text-gray-400 mt-2">Just a moment</p>
        </div>
      </main>
    );
  }

  // No resume found at all
  if (error && !resume) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="text-red-400">{error}</p>
        <a href="/" className="text-orange-400 underline mt-4 inline-block">Try again</a>
      </main>
    );
  }

  // AI processing failed — resume already cleaned from DB
  if (resume?.processing_error) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="text-5xl mb-6">&#9888;&#65039;</p>
        <h1 className="text-2xl font-bold mb-4">Something Went Wrong</h1>
        <p className="text-gray-400 mb-2 max-w-lg mx-auto">
          We were unable to process your resume after multiple attempts.
        </p>
        <p className="text-gray-500 text-sm mb-8 max-w-lg mx-auto">
          Your payment has been recorded. Please contact us at support@resumeflame.com
          for assistance or a refund. Your uploaded resume has been securely deleted from our servers.
        </p>
        <a
          href="/"
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors inline-block"
        >
          Go Back Home
        </a>
      </main>
    );
  }

  // Processing — payment confirmed, waiting for AI (or failed)
  if (processing || (resume?.paid && !roast) || (error && !roast && paymentConfirmed.current)) {
    // If there's an error, show the error instead of the spinner
    if (error && !processing) {
      return (
        <main className="max-w-3xl mx-auto px-6 py-20 text-center">
          <p className="text-5xl mb-6">&#9888;&#65039;</p>
          <h1 className="text-2xl font-bold mb-4">Something Went Wrong</h1>
          <p className="text-gray-400 mb-2 max-w-lg mx-auto">
            We were unable to process your resume. This is usually a temporary issue on our end.
          </p>
          <p className="text-gray-500 text-sm mb-8 max-w-lg mx-auto">
            Please try uploading your resume again.
          </p>
          <a
            href="/"
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors inline-block"
          >
            Go Back Home
          </a>
        </main>
      );
    }

    return (
      <main className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="animate-pulse">
          <p className="text-4xl mb-4">&#128293;</p>
          <h1 className="text-2xl font-bold">Analyzing your resume...</h1>
          <p className="text-gray-400 mt-2">Payment confirmed! Generating your results — this takes about 15-30 seconds.</p>
        </div>
      </main>
    );
  }

  // Payment wall
  if (!resume?.paid && !processing) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-4xl mb-4">&#128293;</p>
        <h1 className="text-3xl font-bold mb-4">Your Resume Is Ready to Be Roasted</h1>
        <p className="text-gray-400 mb-2 max-w-lg mx-auto">
          We&apos;ve received your resume. Choose a plan below to unlock your full AI
          resume review, score, roast, and professionally rewritten resume.
        </p>
        <p className="text-xs text-gray-500 mb-8">
          Results are delivered instantly after payment.
        </p>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
          <div className="bg-gray-900 border-2 border-orange-500 rounded-xl p-6 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-xs font-bold px-3 py-1 rounded-full">
              POPULAR
            </span>
            <h3 className="text-lg font-semibold">Basic Fix</h3>
            <p className="text-3xl font-bold mt-2">$3</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-400">
              <li>&#10003; Resume score (1-10)</li>
              <li>&#10003; AI roast & feedback</li>
              <li>&#10003; Key issues identified</li>
              <li>&#10003; AI-rewritten resume</li>
              <li>&#10003; Stronger action verbs</li>
              <li>&#10003; Quantified achievements</li>
            </ul>
            <button
              onClick={() => handlePayment("basic")}
              disabled={paymentLoading}
              className="mt-6 w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {paymentLoading ? "Loading..." : "Get Basic Fix — $3"}
            </button>
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
            <button
              onClick={() => handlePayment("pro")}
              disabled={paymentLoading}
              className="mt-6 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {paymentLoading ? "Loading..." : "Get Pro Fix — $5"}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          All sales are final — no refunds. By purchasing, you consent to immediate digital delivery and waive any cooling-off period.
          See our <a href="/refund" className="underline hover:text-gray-300">Refund Policy</a> and <a href="/terms" className="underline hover:text-gray-300">Terms of Service</a>.
          Payments processed securely via Lemon Squeezy.
        </p>
      </main>
    );
  }

  // Thank you screen — after PDF downloaded
  if (downloaded) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="text-5xl mb-6">&#127881;</p>
        <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
        <p className="text-gray-400 mb-2 max-w-lg mx-auto">
          Your improved resume has been downloaded. Your uploaded resume has been
          securely deleted from our servers.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          We hope ResumeFlame helps you land your dream job!
        </p>

        <div className="flex flex-col items-center gap-4">
          <a
            href="/"
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors inline-block"
          >
            Roast Another Resume
          </a>

          {fix && (
            <button
              onClick={() => {
                setDownloaded(false);
              }}
              className="text-gray-400 hover:text-white text-sm underline transition-colors"
            >
              Go back to results
            </button>
          )}
        </div>

        <div className="mt-10 border-t border-gray-800 pt-8">
          <p className="text-gray-500 text-sm mb-3">Enjoyed the roast? Share it!</p>
          <button
            onClick={() => {
              const text = `My resume just got roasted by AI and scored ${roast?.score}/10 on ResumeFlame! Try it: https://resumeflame.com`;
              navigator.clipboard.writeText(text);
            }}
            className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Copy Share Text
          </button>
        </div>
      </main>
    );
  }

  // Results page — roast + fix ready
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      {/* Score */}
      <div className="text-center mb-10">
        <p className="text-sm text-gray-400 uppercase tracking-wide">Your Resume Score</p>
        <p className="text-7xl font-bold mt-2">
          <span
            className={
              (roast?.score || 0) <= 3
                ? "text-red-500"
                : (roast?.score || 0) <= 6
                ? "text-yellow-500"
                : "text-green-500"
            }
          >
            {roast?.score}
          </span>
          <span className="text-2xl text-gray-500">/10</span>
        </p>
        {roast?.one_liner && (
          <p className="mt-3 text-lg text-gray-300 italic">&quot;{roast.one_liner}&quot;</p>
        )}
      </div>

      {/* Roast Lines */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          &#128293; The Roast
        </h2>
        <div className="space-y-3">
          {roast?.roast_lines.map((line, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-gray-300">
              {line}
            </div>
          ))}
        </div>
      </section>

      {/* Issues */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Key Issues Found</h2>
        <ul className="space-y-2">
          {roast?.issues.map((issue, i) => (
            <li key={i} className="flex items-start gap-2 text-gray-400">
              <span className="text-red-400 mt-0.5">&#10007;</span>
              {issue}
            </li>
          ))}
        </ul>
      </section>

      {/* Fixed Resume + Download */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          &#9989; Your Fixed Resume
        </h2>

        {fix ? (
          <div className="bg-gray-900 border border-green-800 rounded-lg p-6">
            <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans leading-relaxed">
              {fix}
            </pre>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleDownloadPDF}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Download Fixed Resume as PDF
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(fix)}
                className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Copy Text
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400 animate-pulse">Generating your improved resume...</p>
          </div>
        )}
      </section>
    </main>
  );
}
