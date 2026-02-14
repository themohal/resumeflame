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
  const [fixLoading, setFixLoading] = useState(false);
  const [error, setError] = useState("");

  // Poll for roast results
  const fetchResume = useCallback(async () => {
    try {
      const res = await fetch(`/api/roast?id=${id}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.resume) {
        setResume(data.resume);
        if (data.resume.roast) {
          setRoast(JSON.parse(data.resume.roast));
          setLoading(false);
        }
        if (data.resume.fix) {
          setFix(data.resume.fix);
        }
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

  // Stop polling once roast is loaded
  useEffect(() => {
    if (roast) {
      // Roast loaded, stop polling after one more check
    }
  }, [roast]);

  const handleUnlockFix = async (tier: "basic" | "pro") => {
    // Check if this is a free tier (first use)
    if (resume?.tier === "free") {
      setFixLoading(true);
      try {
        const res = await fetch("/api/fix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeId: id }),
        });
        const data = await res.json();
        if (data.fix) {
          setFix(data.fix);
          setResume((prev) => prev ? { ...prev, paid: true } : prev);
        }
      } catch {
        setError("Failed to generate fix");
      }
      setFixLoading(false);
      return;
    }

    // Open Paddle checkout
    const priceId =
      tier === "pro"
        ? process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PRO
        : process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_BASIC;

    const paddleEnv = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || "sandbox";
    const paddleToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

    // Load Paddle.js dynamically
    if (!(window as unknown as Record<string, unknown>).Paddle) {
      const script = document.createElement("script");
      script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
      script.onload = () => {
        const Paddle = (window as unknown as Record<string, unknown>).Paddle as {
          Environment: { set: (env: string) => void };
          Initialize: (opts: { token: string }) => void;
          Checkout: {
            open: (opts: {
              items: { priceId: string; quantity: number }[];
              customData: { resume_id: string; tier: string };
              successCallback: () => void;
            }) => void;
          };
        };
        if (paddleEnv === "sandbox") {
          Paddle.Environment.set("sandbox");
        }
        Paddle.Initialize({ token: paddleToken || "" });
        openCheckout(Paddle, priceId || "", tier);
      };
      document.head.appendChild(script);
    } else {
      const Paddle = (window as unknown as Record<string, unknown>).Paddle as {
        Checkout: {
          open: (opts: {
            items: { priceId: string; quantity: number }[];
            customData: { resume_id: string; tier: string };
            successCallback: () => void;
          }) => void;
        };
      };
      openCheckout(Paddle, priceId || "", tier);
    }
  };

  const openCheckout = (
    Paddle: {
      Checkout: {
        open: (opts: {
          items: { priceId: string; quantity: number }[];
          customData: { resume_id: string; tier: string };
          successCallback: () => void;
        }) => void;
      };
    },
    priceId: string,
    tier: string
  ) => {
    Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customData: { resume_id: id, tier },
      successCallback: async () => {
        // Payment success — generate fix
        setFixLoading(true);
        // Wait a moment for webhook to process
        await new Promise((r) => setTimeout(r, 3000));
        const res = await fetch("/api/fix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeId: id }),
        });
        const data = await res.json();
        if (data.fix) {
          setFix(data.fix);
          setResume((prev) => prev ? { ...prev, paid: true } : prev);
        }
        setFixLoading(false);
      },
    });
  };

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="animate-pulse">
          <p className="text-4xl mb-4">&#128293;</p>
          <h1 className="text-2xl font-bold">Roasting your resume...</h1>
          <p className="text-gray-400 mt-2">This takes about 10 seconds</p>
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
        ) : fixLoading ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400 animate-pulse">Generating your improved resume...</p>
          </div>
        ) : (
          <div>
            {/* Blurred preview */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 relative overflow-hidden">
              <div className="blur-content text-sm text-gray-400 leading-relaxed">
                <p>JOHN DOE — Senior Software Engineer</p>
                <p>Professional Summary: Results-driven engineer with 5+ years...</p>
                <p>Led cross-functional team of 12 engineers to deliver...</p>
                <p>Increased system performance by 340% through...</p>
                <p>Built and deployed microservices architecture serving 2M+...</p>
                <p>Reduced deployment time from 4 hours to 15 minutes...</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60">
                <div className="text-center">
                  <p className="text-lg font-semibold mb-4">Unlock Your Rewritten Resume</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {resume?.tier === "free" ? (
                      <button
                        onClick={() => handleUnlockFix("basic")}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                      >
                        Unlock Free (1st Use)
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleUnlockFix("basic")}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                        >
                          Basic Fix — $3
                        </button>
                        <button
                          onClick={() => handleUnlockFix("pro")}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                        >
                          Pro Fix + ATS — $5
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Share & CTA */}
      <div className="text-center border-t border-gray-800 pt-8">
        <p className="text-gray-400 mb-4">Share your roast score with friends</p>
        <button
          onClick={() => {
            const text = `My resume just got roasted by AI and scored ${roast?.score}/10 on ResumeFlame! 🔥`;
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
