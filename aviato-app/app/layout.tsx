import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aviato — Semi-Private Flight Search",
  description: "Compare semi-private flights across every carrier. JSX, Aero, Slate, Tradewind, Surf Air, and BARK Air.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
