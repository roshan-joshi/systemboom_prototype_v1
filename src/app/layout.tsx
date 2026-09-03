import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "SYSTEMBOOM",
  description:
    "SYSTEMBOOM — your universe, your world, your life. High-fidelity interactive prototype.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0d14" },
    { media: "(prefers-color-scheme: light)", color: "#e8ecf3" },
  ],
};

/**
 * Theme boot: runs before paint to avoid a theme flash.
 * Priority: ?theme= param (used by review tooling) → saved choice → dark.
 */
const themeBootScript = `(function(){try{var p=new URLSearchParams(location.search).get("theme");var s=localStorage.getItem("sb-theme");var t=(p==="light"||p==="dark")?p:(s==="light"||s==="dark")?s:"dark";document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme="dark";}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        {children}
      </body>
    </html>
  );
}
