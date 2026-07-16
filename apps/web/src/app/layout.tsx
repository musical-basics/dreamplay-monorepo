import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { EmailTracker } from "@/components/EmailTracker";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import NewsletterPopup from "@/components/NewsletterPopup";
import { AppProviders } from "@/components/AppProviders";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://dreamplaypianos.com'),
  title: {
    template: '%s | DreamPlay Pianos',
    default: 'DreamPlay One | A Piano That Fits Your Hands',
  },
  description: 'The DreamPlay One is a premium digital piano with narrower keys designed to fit your hands — reducing strain, preventing injury, and unlocking pieces a standard keyboard puts out of reach.',
  openGraph: {
    title: 'DreamPlay One | A Piano That Fits Your Hands',
    description: 'A premium digital piano featuring ergonomically narrower keys designed to eliminate strain, prevent injury, and let you play freely.',
    url: 'https://dreamplaypianos.com',
    siteName: 'DreamPlay Pianos',
    images: [{ url: '/images/marketing/dreamplay-one-hero.jpg', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: "/images/logos/favicon.png",
    apple: "/images/logos/webclip.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        {/* Fonts preconnect */}
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link href="https://fonts.gstatic.com" rel="preconnect" crossOrigin="anonymous" />
      </head>
      <body>
        {/* AppProviders wraps EVERYTHING in the body so useAnalytics() has
            context on every page and in the layout-level popups/banners. */}
        <AppProviders>
          <EmailTracker />
          {children}
          <NewsletterPopup />
          <AnnouncementBanner />
        </AppProviders>
      </body>
    </html>
  );
}
