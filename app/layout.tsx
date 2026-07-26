import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Progress, Not Perfection",
  description: "A calm personal operating system for forward motion.",
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
};

export const viewport: Viewport = {
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
