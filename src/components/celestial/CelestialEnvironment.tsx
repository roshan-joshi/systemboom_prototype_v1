"use client";

import { useCelestialSurface } from "@/lib/celestial/flags";

/** The existing World, under celestial light. No shared tokens or mascot selectors change.
 * Removing the feature removes this entire stylesheet, including the closed-page treatment. */
export function CelestialEnvironment() {
  const enabled = useCelestialSurface("moment");
  if (!enabled) return null;
  return <span hidden data-sb-celestial-environment><style>{`
.sb-social:has([data-sb-celestial-environment]) {
  background-color:#080d1c;
  background-image:radial-gradient(ellipse 85% 850px at 0% 240px,#24355b88,transparent 75%),radial-gradient(ellipse 65% 1100px at 100% 800px,#492b6340,transparent 75%),radial-gradient(circle at 12% 13%,#cfdbed77 .7px,transparent 1.3px),radial-gradient(circle at 78% 31%,#dfd7be55 .7px,transparent 1.4px),radial-gradient(circle at 46% 75%,#adc7ee44 .6px,transparent 1.2px);
  background-size:auto,auto,271px 389px,419px 517px,367px 457px;
}
.sb-social:has([data-sb-celestial-environment]) [data-sb-sheet] {
  background:linear-gradient(135deg,#111a2cd9,#0d1220e8 58%,#19172acc);
  box-shadow:0 1px 0 #b4c7ee14 inset,0 24px 70px #03071422;
}
.sb-social:has([data-sb-celestial-environment]) [data-sb-moment] { isolation:isolate; }
.sb-social:has([data-sb-celestial-environment]) [data-sb-moment]::before {
  content:"";position:absolute;inset:-12px -18px;z-index:-1;pointer-events:none;
  background:radial-gradient(ellipse at 12% 92%,#7050ba40,transparent 63%),radial-gradient(ellipse at 92% 54%,#28799833,transparent 68%),linear-gradient(110deg,#182440aa,#11172aa0);
  box-shadow:inset 1px 0 #d9bb6c55,inset -1px 0 #a0c8fa33;
  opacity:0;transition:opacity 420ms ease-out;
}
.sb-social:has([data-sb-celestial-environment]) [data-sb-moment]:has([data-sb-resonate-open="1"])::before {opacity:1;}
html[data-theme="light"] .sb-social:has([data-sb-celestial-environment]) {
  background-color:#ece7df;
  background-image:radial-gradient(ellipse 90% 800px at 12% 0%,#fffaf0,transparent 80%),radial-gradient(ellipse 60% 1000px at 100% 800px,#d8c7a766,transparent 75%),linear-gradient(118deg,transparent 35%,#ffffff88 35.1%,transparent 35.4%);
  background-size:auto;
}
html[data-theme="light"] .sb-social:has([data-sb-celestial-environment]) [data-sb-sheet] {
  background:linear-gradient(125deg,#fffdf8,#f8f4ed 70%,#f1e8d9);
  box-shadow:0 1px 0 #fff inset,0 16px 52px #65502b12,0 0 0 1px #a68b541b;
}
html[data-theme="light"] .sb-social:has([data-sb-celestial-environment]) [data-sb-moment]::before {
  background:radial-gradient(ellipse at 18% 85%,#dbb26035,transparent 65%),radial-gradient(ellipse at 94% 55%,#b7c0cd2b,transparent 70%),linear-gradient(125deg,#fffaf0bb,#f3e7d5bb);
  box-shadow:inset 1px 0 #aa7c3666,inset -1px 0 #aa7c362b;
}
@media(prefers-reduced-motion:reduce){
.sb-social:has([data-sb-celestial-environment]) [data-sb-moment]::before {transition:opacity 150ms linear;}
.sb-celestial-field *, .sb-resonate * {animation:none!important;transition-duration:150ms!important;}
}
`}</style></span>;
}
