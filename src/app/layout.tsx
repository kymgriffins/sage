import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "../stack/client";
import { ThemeProvider } from "@/components/theme-provider";
import { StructuredData } from "@/components/structured-data";
import ErrorBoundary from "@/components/error-boundary";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SAGE - AI-Powered Trading Stream Analysis",
  description: "Extract trading insights from YouTube streams with AI. Get strategy analysis, trade detection, and performance metrics in seconds.",
  keywords: ["trading analysis", "AI trading", "YouTube stream analysis", "trading insights", "stock analysis", "crypto trading"],
  authors: [{ name: "SAGE AI" }],
  creator: "SAGE AI",
  publisher: "SAGE AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://sage-ai.com'), // Replace with your actual domain
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://sage-ai.com',
    title: 'SAGE - AI-Powered Trading Stream Analysis',
    description: 'Extract trading insights from YouTube streams with AI. Get strategy analysis, trade detection, and performance metrics in seconds.',
    siteName: 'SAGE AI',
    images: [
      {
        url: '/og-image.jpg', // Add your OG image
        width: 1200,
        height: 630,
        alt: 'SAGE - AI Trading Analysis',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SAGE - AI-Powered Trading Stream Analysis',
    description: 'Extract trading insights from YouTube streams with AI.',
    creator: '@sage_ai',
    images: ['/og-image.jpg'], // Add your Twitter image
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload critical resources */}
        <link
          rel="preload"
          href="/_next/static/media/geist-sans.var.2cd9186f.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/_next/static/media/geist-mono.var.ffa89f7c.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Performance optimizations */}
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <StackProvider app={stackClientApp}>
            <StackTheme>
              <Navigation />
              <div className="pt-16"> {/* Account for fixed navigation height */}
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>

                {/* Structured Data for SEO */}
                <StructuredData type="software" />
              </div>
            </StackTheme>
          </StackProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
