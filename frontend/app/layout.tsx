import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Manrope } from "next/font/google";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { HashScrollHandler } from "@/components/navigation/HashScrollHandler";
import { SessionBootstrap } from "@/components/SessionBootstrap";
import { defaultOpenGraphImages, getSiteUrl } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "LastMinute ITR — AI-assisted filing prep",
    template: "%s · LastMinute ITR",
  },
  description:
    "Last-minute ITR prep with AI. Import Form 16 & AIS, compare old vs new regime, catch mismatches — then file yourself on incometax.gov.in.",
  keywords: [
    "ITR filing",
    "income tax return",
    "old vs new regime",
    "AIS mismatch",
    "Form 16",
    "India tax",
    "last minute ITR",
  ],
  openGraph: {
    title: "LastMinute ITR — AI-assisted filing prep",
    description:
      "Import-first ITR prep with lawful optimization — you file and submit on incometax.gov.in yourself.",
    type: "website",
    locale: "en_IN",
    images: defaultOpenGraphImages,
  },
  twitter: {
    card: "summary_large_image",
    title: "LastMinute ITR",
    description:
      "Prepare your ITR with AI, then file and e-verify on incometax.gov.in yourself.",
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${display.variable} ${manrope.variable} overflow-x-hidden font-sans`}
      >
        <AnalyticsProvider>
          <SessionBootstrap />
          <HashScrollHandler />
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}
