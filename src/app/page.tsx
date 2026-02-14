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
          Get Your Resume{" "}
          <span className="text-orange-500">Roasted</span> by AI
        </h1>
        <p className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto">
          Upload your resume. Get brutally honest feedback in seconds.
          Then unlock a professional AI rewrite that actually lands interviews.
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
            {loading ? "Roasting your resume..." : "Roast My Resume (Free)"}
          </button>
          <p className="text-xs text-gray-500 mt-3">
            First roast is completely free. No sign-up required.
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
              title: "Upload Resume",
              desc: "Upload your resume as a PDF. We parse it instantly.",
            },
            {
              step: "2",
              title: "Get Roasted",
              desc: "Our AI gives you brutally honest, funny, and useful feedback for free.",
            },
            {
              step: "3",
              title: "Unlock the Fix",
              desc: "Pay to unlock a professionally rewritten resume that lands interviews.",
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

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Simple Pricing</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold">Free Roast</h3>
            <p className="text-3xl font-bold mt-2">$0</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-400">
              <li>&#10003; Resume score (1-10)</li>
              <li>&#10003; Brutal honest roast</li>
              <li>&#10003; Key issues identified</li>
              <li className="text-gray-600">&#10007; Rewritten resume</li>
              <li className="text-gray-600">&#10007; ATS optimization</li>
            </ul>
          </div>

          <div className="bg-gray-900 border-2 border-orange-500 rounded-xl p-6 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-xs font-bold px-3 py-1 rounded-full">
              POPULAR
            </span>
            <h3 className="text-lg font-semibold">Basic Fix</h3>
            <p className="text-3xl font-bold mt-2">$3</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-400">
              <li>&#10003; Everything in Free</li>
              <li>&#10003; AI-rewritten resume</li>
              <li>&#10003; Better action verbs</li>
              <li>&#10003; Quantified achievements</li>
              <li className="text-gray-600">&#10007; ATS optimization</li>
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
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
