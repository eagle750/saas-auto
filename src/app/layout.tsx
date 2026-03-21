import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://ai-auto-saas.dev";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "AI-Auto-SaaS — Build SaaS with AI",
    template: "%s | AI-Auto-SaaS",
  },
  description:
    "Describe your SaaS idea and let AI build, configure, and deploy it for you. From concept to GitHub push in minutes.",
  keywords: [
    "AI SaaS builder",
    "automated SaaS generation",
    "AI code generation",
    "SaaS platform",
    "no-code SaaS builder",
    "AI-powered deployment",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "AI-Auto-SaaS",
    title: "AI-Auto-SaaS — Build SaaS with AI",
    description:
      "Describe your SaaS idea. We build, configure, and deploy it automatically.",
    images: [
      { url: "/og-image.png", width: 1200, height: 630, alt: "AI-Auto-SaaS" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI-Auto-SaaS — Build SaaS with AI",
    description: "Describe your SaaS idea. We build it.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: baseUrl },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen flex flex-col antialiased bg-[#0A0F1C] text-[#F8FAFC]`}
      >
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
