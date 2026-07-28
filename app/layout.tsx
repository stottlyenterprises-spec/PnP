import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "D.E.E.D.S.",
    template: "%s | D.E.E.D.S.",
  },
  description: "D.E.E.D.S. helps you detect, explore, enable, drive, and sustain progress. Progress, Not Perfection.",
  manifest: "/manifest.webmanifest",
  applicationName: "D.E.E.D.S.",
  appleWebApp: {
    capable: true,
    title: "D.E.E.D.S.",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/deeds-icon.svg",
    shortcut: "/deeds-icon.svg",
    apple: "/deeds-icon.svg",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#15281f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
