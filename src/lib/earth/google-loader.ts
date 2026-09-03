"use client";

/**
 * Google Maps JavaScript API loader (current dynamic-import bootstrap).
 *
 * Key comes ONLY from NEXT_PUBLIC_GOOGLE_MAPS_API_KEY — never hardcoded.
 * Required APIs on the key's project:
 *   - Maps JavaScript API   (Map3DElement, camera animation)
 *   - Places API (New)      (Place.searchByText)
 *
 * The maps3d library currently ships in the "beta" channel.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
  interface Window {
    google?: any;
  }
}

export function googleMapsKey(): string | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  return key && key.trim().length > 0 ? key.trim() : null;
}

let bootPromise: Promise<any> | null = null;

/** Injects Google's official bootstrap once; resolves to `google.maps`. */
export function loadGoogleMaps(): Promise<any> {
  if (bootPromise) return bootPromise;
  const key = googleMapsKey();
  if (!key) return Promise.reject(new Error("missing-key"));

  bootPromise = new Promise((resolve, reject) => {
    if (window.google?.maps?.importLibrary) {
      resolve(window.google.maps);
      return;
    }
    // Official Google Maps JS API dynamic bootstrap (readable form).
    const params: Record<string, string> = { key, v: "beta", loading: "async" };
    const g = window as any;
    g.google = g.google || {};
    g.google.maps = g.google.maps || {};
    const maps = g.google.maps;
    let apiPromise: Promise<void> | null = null;
    const libraries: Record<string, unknown> = {};
    maps.importLibrary =
      maps.importLibrary ||
      ((lib: string, ...args: unknown[]) => {
        if (!apiPromise) {
          apiPromise = new Promise<void>((res, rej) => {
            const script = document.createElement("script");
            const query = new URLSearchParams(params);
            query.set("libraries", Object.keys(libraries).join(","));
            query.set("callback", "__sbGmapsReady");
            (window as any).__sbGmapsReady = () => res();
            script.src = `https://maps.googleapis.com/maps/api/js?${query}`;
            script.onerror = () => rej(new Error("load-failed"));
            script.nonce = (document.querySelector("script[nonce]") as HTMLScriptElement | null)
              ?.nonce ?? "";
            document.head.appendChild(script);
          });
        }
        libraries[lib] = true;
        return apiPromise.then(() => (g.google.maps as any).importLibrary(lib, ...args));
      });
    maps
      .importLibrary("core")
      .then(() => resolve(g.google.maps))
      .catch((e: unknown) => {
        bootPromise = null;
        reject(e);
      });
  });
  return bootPromise;
}
