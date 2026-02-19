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

  const formatResumeHTML = (text: string): string => {
    const escaped = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const lines = escaped.split("\n");
    let html = "";
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines (add spacing)
      if (!line) {
        if (inList) {
          html += "</ul>";
          inList = false;
        }
        continue;
      }

      // Detect section headers: ALL CAPS lines, or lines ending with ":"
      // that are short (< 60 chars) and don't start with bullet
      const isHeader =
        (line === line.toUpperCase() && line.length > 2 && line.length < 60 && !/^[-•●▪*]/.test(line) && /[A-Z]/.test(line)) ||
        (/^[A-Z][A-Za-z\s&/]+:$/.test(line) && line.length < 50);

      // Detect name (first non-empty line that looks like a name)
      const isFirstContentLine = i === 0 || lines.slice(0, i).every((l) => !l.trim());

      // Detect bullet points
      const isBullet = /^[-•●▪*]\s/.test(line) || /^\d+[.)]\s/.test(line);

      // Detect contact info line (contains email, phone, or multiple | / separators)
      const isContact =
        (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(line) ||
          /\(\d{3}\)\s?\d{3}[-.]?\d{4}/.test(line) ||
          /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(line)) &&
        !isBullet;

      if (isFirstContentLine && !isHeader && !isBullet) {
        // Likely the person's name
        html += `<h1 class="resume-name">${line}</h1>`;
      } else if (isContact) {
        html += `<p class="contact-info">${line}</p>`;
      } else if (isHeader) {
        if (inList) {
          html += "</ul>";
          inList = false;
        }
        const headerText = line.replace(/:$/, "");
        html += `<h2 class="section-header">${headerText}</h2><div class="section-divider"></div>`;
      } else if (isBullet) {
        const bulletText = line.replace(/^[-•●▪*]\s*/, "").replace(/^\d+[.)]\s*/, "");
        if (!inList) {
          html += '<ul class="bullet-list">';
          inList = true;
        }
        html += `<li>${bulletText}</li>`;
      } else {
        if (inList) {
          html += "</ul>";
          inList = false;
        }
        // Regular text — could be job title, company, date, etc.
        // Detect date patterns on the right (e.g., "Software Engineer | Google | Jan 2020 - Present")
        const hasDatePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/.test(line) ||
          /\b\d{4}\s*[-–]\s*(Present|\d{4})\b/.test(line);
        if (hasDatePattern) {
          html += `<p class="role-line">${line}</p>`;
        } else {
          html += `<p class="body-text">${line}</p>`;
        }
      }
    }
    if (inList) html += "</ul>";
    return html;
  };

  const handleDownloadPDF = () => {
    if (!fix) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const resumeContent = formatResumeHTML(fix);

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Resume - ResumeFlame</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      line-height: 1.65;
      color: #1f2937;
      font-size: 10.5pt;
      background: #fff;
    }

    .page-container {
      max-width: 780px;
      margin: 0 auto;
      padding: 48px 52px 40px;
    }

    /* ── Header / Logo ── */
    .pdf-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 14px;
      border-bottom: 2px solid #f97316;
      margin-bottom: 28px;
    }
    .logo-mark {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .logo-mark svg {
      width: 22px;
      height: 22px;
    }
    .logo-text {
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-size: 14pt;
      color: #111827;
      letter-spacing: -0.3px;
    }
    .logo-text span {
      color: #f97316;
    }
    .header-tagline {
      font-size: 8pt;
      color: #9ca3af;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* ── Resume Name ── */
    .resume-name {
      font-family: 'Playfair Display', 'Georgia', serif;
      font-size: 22pt;
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
      letter-spacing: -0.5px;
      line-height: 1.2;
    }

    /* ── Contact Info ── */
    .contact-info {
      font-size: 9.5pt;
      color: #6b7280;
      margin-bottom: 20px;
      line-height: 1.5;
    }

    /* ── Section Headers ── */
    .section-header {
      font-family: 'Inter', sans-serif;
      font-size: 11pt;
      font-weight: 700;
      color: #111827;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 22px;
      margin-bottom: 2px;
      padding-bottom: 0;
    }
    .section-divider {
      height: 2px;
      background: linear-gradient(90deg, #f97316 0%, #fde68a 60%, transparent 100%);
      margin-bottom: 12px;
      border-radius: 1px;
    }

    /* ── Role / Date Lines ── */
    .role-line {
      font-size: 10.5pt;
      font-weight: 600;
      color: #374151;
      margin-top: 10px;
      margin-bottom: 4px;
    }

    /* ── Body Text ── */
    .body-text {
      font-size: 10.5pt;
      color: #374151;
      margin-bottom: 3px;
      line-height: 1.6;
    }

    /* ── Bullet List ── */
    .bullet-list {
      list-style: none;
      padding-left: 16px;
      margin-top: 4px;
      margin-bottom: 8px;
    }
    .bullet-list li {
      position: relative;
      padding-left: 14px;
      margin-bottom: 4px;
      font-size: 10.5pt;
      color: #374151;
      line-height: 1.55;
    }
    .bullet-list li::before {
      content: "";
      position: absolute;
      left: 0;
      top: 7px;
      width: 5px;
      height: 5px;
      background: #f97316;
      border-radius: 50%;
    }

    /* ── Footer ── */
    .pdf-footer {
      margin-top: 36px;
      padding-top: 14px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-text {
      font-size: 7.5pt;
      color: #d1d5db;
    }
    .footer-brand {
      font-size: 7.5pt;
      color: #d1d5db;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .footer-brand svg { width: 10px; height: 10px; }

    /* ── Print Styles ── */
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page-container { padding: 32px 40px 28px; max-width: 100%; }
      .pdf-header { margin-bottom: 24px; }
      .section-header { margin-top: 18px; }
    }

    @page {
      margin: 0.4in 0.3in;
      size: letter;
    }
  </style>
</head>
<body>
  <div class="page-container">

    <!-- Header with Logo -->
    <div class="pdf-header">
      <div class="logo-mark">
        <svg viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 36c-6.6 0-12-5.4-12-12 0-4.4 2.4-8.8 6-14 1.2-1.8 2.6-3.6 4-5.4.4-.6 1.2-.6 1.6 0 1 1.2 2 2.6 2.8 4 .2-.8.6-1.6 1-2.4.3-.5 1-.5 1.3 0C24.4 12.8 28 19.2 28 24c0 6.6-5.4 12-12 12z" fill="url(#fg)"/>
          <path d="M16 32c4.4 0 8-3.6 8-8 0-3.2-2-7.2-5.2-12.4-.4.8-.8 1.8-1 2.8-.2.6-1 .8-1.4.4-1.4-1.2-2.6-3-3.6-4.4C10.4 14 8 17.6 8 24c0 4.4 3.6 8 8 8z" fill="#fff" opacity="0.25"/>
          <defs><linearGradient id="fg" x1="16" y1="36" x2="16" y2="0"><stop stop-color="#f97316"/><stop offset="1" stop-color="#ef4444"/></linearGradient></defs>
        </svg>
        <span class="logo-text">Resume<span>Flame</span></span>
      </div>
      <span class="header-tagline">AI-Powered Resume</span>
    </div>

    <!-- Resume Content -->
    ${resumeContent}

    <!-- Footer -->
    <div class="pdf-footer">
      <span class="footer-text">Generated by ResumeFlame &mdash; AI Resume Optimization</span>
      <span class="footer-brand">
        <svg viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 36c-6.6 0-12-5.4-12-12 0-4.4 2.4-8.8 6-14 1.2-1.8 2.6-3.6 4-5.4.4-.6 1.2-.6 1.6 0 1 1.2 2 2.6 2.8 4 .2-.8.6-1.6 1-2.4.3-.5 1-.5 1.3 0C24.4 12.8 28 19.2 28 24c0 6.6-5.4 12-12 12z" fill="#d1d5db"/>
        </svg>
        resumeflame.vercel.app
      </span>
    </div>

  </div>

  <script>
    window.onload = function() {
      // Small delay for fonts to load
      setTimeout(function() {
        window.print();
        window.onafterprint = function() { window.close(); };
      }, 500);
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
              const text = `My resume just got roasted by AI and scored ${roast?.score}/10 on ResumeFlame! Try it: https://resumeflame.vercel.app`;
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
