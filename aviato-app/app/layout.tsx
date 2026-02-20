import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aviato — Semi-Private Flight Search",
  description: "Compare semi-private flights across every carrier. JSX, Aero, Slate, Tradewind, and BARK Air.",
  metadataBase: new URL("https://aviatoair.com"),
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Aviato — Semi-Private Flight Search",
    description: "Search and compare semi-private flights across JSX, Aero, Tradewind, Slate, and BARK Air.",
    url: "https://aviatoair.com",
    siteName: "Aviato",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Aviato — Search semi-private flights",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aviato — Semi-Private Flight Search",
    description: "Search and compare semi-private flights across JSX, Aero, Tradewind, Slate, and BARK Air.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-VS8JNN2ES9"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('consent', 'default', {
              analytics_storage: 'granted'
            });
            gtag('config', 'G-VS8JNN2ES9');
          `}
        </Script>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
