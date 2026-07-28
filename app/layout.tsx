import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Progress, Not Perfection",
  description: "Personal planning, health, and work in one place.",
  manifest: "/manifest.webmanifest",
  applicationName: "PNP",
  appleWebApp: {
    capable: true,
    title: "PNP",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/pnp-icon.svg",
    shortcut: "/pnp-icon.svg",
    apple: "/pnp-icon.svg",
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
