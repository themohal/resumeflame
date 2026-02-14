import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ResumeFlame - AI Resume Reviewer & Professional Resume Rewriter",
  description:
    "Get your resume reviewed by AI in seconds. ResumeFlame scores your resume, identifies weaknesses, and rewrites it with ATS-optimized keywords to land more job interviews. Professional AI resume builder and career tool.",
  keywords: [
    "resume review",
    "AI resume writer",
    "resume checker",
    "ATS resume optimization",
    "resume rewriter",
    "resume score",
    "resume feedback",
    "professional resume builder",
    "job search tool",
    "career advice",
    "resume tips",
    "resume improvement",
    "AI resume builder",
    "resume analyzer",
    "cover letter generator",
    "resume roast",
    "land more interviews",
    "job application help",
  ],
  openGraph: {
    title: "ResumeFlame - AI Resume Reviewer & Professional Rewriter",
    description:
      "Upload your resume, get instant AI feedback and a score out of 10, then unlock a professionally rewritten resume optimized for ATS systems.",
    type: "website",
    siteName: "ResumeFlame",
  },
  twitter: {
    card: "summary_large_image",
    title: "ResumeFlame - AI Resume Reviewer & Professional Rewriter",
    description:
      "Get your resume scored and rewritten by AI. Land more interviews with ATS-optimized resumes.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://resumeflame.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="border-b border-gray-800 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <a href="/" className="text-xl font-bold">
              Resume<span className="text-orange-500">Flame</span>
            </a>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="/#pricing" className="hover:text-white transition">
                Pricing
              </a>
              <a href="/terms" className="hover:text-white transition">
                Terms
              </a>
              <a href="/privacy" className="hover:text-white transition">
                Privacy
              </a>
            </div>
          </div>
        </nav>
        {children}
        <footer className="border-t border-gray-800 px-6 py-8 mt-20">
          <div className="max-w-5xl mx-auto text-center text-sm text-gray-500">
            <p>&copy; 2026 ResumeFlame. All rights reserved.</p>
            <div className="flex justify-center gap-6 mt-3">
              <a href="/terms" className="hover:text-gray-300 transition">
                Terms of Service
              </a>
              <a href="/privacy" className="hover:text-gray-300 transition">
                Privacy Policy
              </a>
              <a href="/refund" className="hover:text-gray-300 transition">
                Refund Policy
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
