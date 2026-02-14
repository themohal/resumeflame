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
  title: "ResumeFlame - Get Your Resume Roasted by AI",
  description:
    "Upload your resume and get brutally honest AI feedback. Free roast, paid professional rewrite. Land more interviews.",
  keywords: ["resume", "AI", "roast", "rewrite", "career", "job search"],
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
