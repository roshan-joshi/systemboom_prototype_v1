import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { IdentityProvider } from "@/components/identity/IdentityProvider";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { RegionSuggestion } from "@/components/i18n/RegionSuggestion";
import { resolveRequestLocale } from "@/lib/i18n/server";
import { localeMeta } from "@/lib/i18n/config";
import { CelestialFlagsProvider } from "@/lib/celestial/flags";

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

// Locale boot: the server already resolved + rendered the right locale (no flash),
// so this only reconciles the <html lang> attribute for the review route's ?lang=
// override before paint — the same early-boot discipline the theme uses (§23).
const localeBootScript = `(function(){try{var p=new URLSearchParams(location.search).get("lang");var ok=["en","es","it","nl","ru","hi","ne","zh-Hans"];if(p&&ok.indexOf(p)>=0){document.documentElement.lang=p;}}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { locale, source, region } = await resolveRequestLocale();
  const meta = localeMeta(locale);
  return (
    <html
      lang={locale}
      dir={meta.dir}
      data-theme="dark"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <script dangerouslySetInnerHTML={{ __html: localeBootScript }} />
        <LocaleProvider initialLocale={locale} initialSource={source} region={region}>
          {/* Stage 23 — Celestial Resonance ships behind flags whose committed defaults are
              ALL OFF (boomEnabled excepted, pinned true). With no local override this provider
              changes nothing that renders. */}
          <CelestialFlagsProvider>
            <IdentityProvider>{children}</IdentityProvider>
          </CelestialFlagsProvider>
          {/* S1 §58–§59: a quiet region-language suggestion (Keep / Switch), never an
              auto-switch, never a modal or a bell event. Self-hides unless a genuine region
              change maps to a different supported language. */}
          <RegionSuggestion />
        </LocaleProvider>
      </body>
    </html>
  );
}
