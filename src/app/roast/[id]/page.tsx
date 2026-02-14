"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

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
}

export default function RoastPage() {
  const params = useParams();
  const id = params.id as string;

  const [resume, setResume] = useState<ResumeData | null>(null);
  const [roast, setRoast] = useState<RoastData | null>(null);
  const [fix, setFix] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Poll for resume data
  const fetchResume = useCallback(async () => {
    try {
      const res = await fetch(`/api/roast?id=${id}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.resume) {
        setResume(data.resume);
        if (data.resume.roast) {
          setRoast(JSON.parse(data.resume.roast));
        }
        if (data.resume.fix) {
          setFix(data.resume.fix);
        }
        // Stop showing loading once we have initial data
        setLoading(false);
      }
    } catch {
      setError("Failed to load results");
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchResume();
    const interval = setInterval(fetchResume, 2000);
    return () => clearInterval(interval);
  }, [fetchResume]);

  const initPaddle = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      if (win.Paddle) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
      script.onload = () => {
        try {
          const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || "sandbox";
          if (environment === "sandbox") {
            win.Paddle.Environment.set("sandbox");
          }
          win.Paddle.Initialize({
            token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "",
          });
          resolve();
        } catch (err) {
          console.error("Paddle init error:", err);
          reject(err);
        }
      };
      script.onerror = () => reject(new Error("Failed to load Paddle.js"));
      document.head.appendChild(script);
    });
  };

  const handlePayment = async (tier: "basic" | "pro") => {
    const priceId =
      tier === "pro"
        ? process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PRO
        : process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_BASIC;

    console.log("Opening Paddle checkout:", { tier, priceId });

    try {
      await initPaddle();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Paddle = (window as any).Paddle;
      Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customData: { resume_id: id, tier },
        successCallback: () => {
          setResume((prev) => prev ? { ...prev, paid: true } : prev);
        },
      });
    } catch (err) {
      console.error("Paddle checkout error:", err);
      setError("Payment system failed to load. Please refresh and try again.");
    }
  };

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="animate-pulse">
          <p className="text-4xl mb-4">&#128196;</p>
          <h1 className="text-2xl font-bold">Processing your resume...</h1>
          <p className="text-gray-400 mt-2">Just a moment</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="text-red-400">{error}</p>
        <a href="/" className="text-orange-400 underline mt-4 inline-block">
          Try again
        </a>
      </main>
    );
  }

  // Payment wall — show before any results
  if (!resume?.paid) {
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
              className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Get Basic Fix — $3
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
              className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Get Pro Fix — $5
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          All purchases are final and non-refundable. Payments processed securely via Paddle.
        </p>
      </main>
    );
  }

  // Paid — waiting for results to generate
  if (!roast) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="animate-pulse">
          <p className="text-4xl mb-4">&#128293;</p>
          <h1 className="text-2xl font-bold">Roasting your resume...</h1>
          <p className="text-gray-400 mt-2">Payment confirmed! Generating your results — this takes about 15 seconds.</p>
        </div>
      </main>
    );
  }

  // Results page — shown after payment and generation
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
            <div
              key={i}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-gray-300"
            >
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

      {/* Fix Section */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          &#9989; The Fix — Rewritten Resume
        </h2>

        {fix ? (
          <div className="bg-gray-900 border border-green-800 rounded-lg p-6">
            <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans leading-relaxed">
              {fix}
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(fix);
              }}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Copy to Clipboard
            </button>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400 animate-pulse">Generating your improved resume...</p>
          </div>
        )}
      </section>

      {/* Share & CTA */}
      <div className="text-center border-t border-gray-800 pt-8">
        <p className="text-gray-400 mb-4">Share your roast score with friends</p>
        <button
          onClick={() => {
            const text = `My resume just got roasted by AI and scored ${roast?.score}/10 on ResumeFlame!`;
            navigator.clipboard.writeText(text);
          }}
          className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Copy Share Text
        </button>
        <div className="mt-6">
          <a
            href="/"
            className="text-orange-400 hover:text-orange-300 underline text-sm"
          >
            Roast another resume
          </a>
        </div>
      </div>
    </main>
  );
}
