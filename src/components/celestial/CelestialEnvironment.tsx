"use client";

import { useCelestialSurface } from "@/lib/celestial/flags";

/** The existing World, under celestial light. No shared tokens or mascot selectors change.
 * Removing the feature removes this entire stylesheet, including the closed-page treatment. */
export function CelestialEnvironment() {
  const enabled = useCelestialSurface("moment");
  if (!enabled) return null;
  return <span hidden data-sb-celestial-environment><style>{`
.sb-social:has([data-sb-celestial-environment]) {
  background-color:#070c18;
  background-image:url('/celestial/environment-cosmos.svg'),radial-gradient(ellipse 90% 1100px at 0% 240px,#23335e88,transparent 78%),radial-gradient(ellipse 75% 1200px at 100% 800px,#41295955,transparent 78%);
  background-size:100% auto,auto,auto;
  background-repeat:no-repeat;
  transition:background-size 680ms cubic-bezier(.22,1,.36,1),background-position 680ms cubic-bezier(.22,1,.36,1);
}
.sb-social:has([data-sb-celestial-environment]):has([data-sb-resonate-attending="1"]){background-size:104% auto,auto,auto;background-position:center -6px,center,center;}
.sb-social:has([data-sb-celestial-environment]):has([data-sb-resonate-open="1"]){background-size:110% auto,auto,auto;background-position:center -18px,center,center;}
.sb-social:has([data-sb-celestial-environment]) [data-sb-sheet] {
  background:linear-gradient(135deg,#101929de,#0a111ee8 58%,#15182cde);
  box-shadow:0 1px 0 #b4c7ee14 inset,0 24px 70px #03071422;
}
.sb-social:has([data-sb-celestial-environment]) [data-sb-moment] { isolation:isolate; }
.sb-social:has([data-sb-celestial-environment]) [data-sb-moment]::before {
  content:"";position:absolute;inset:-12px -18px;z-index:-1;pointer-events:none;
  background:radial-gradient(ellipse at 8% 83%,#8c4ea65c,transparent 66%),radial-gradient(ellipse at 94% 64%,#367da54d,transparent 70%),radial-gradient(ellipse at 50% 100%,#294a7966,transparent 80%);
  mask-image:linear-gradient(transparent,#000 10%,#000 86%,transparent);
  box-shadow:none;
  opacity:0;transition:opacity 420ms ease-out;
}
.sb-social:has([data-sb-celestial-environment]) [data-sb-moment]:has([data-sb-resonate-open="1"])::before {opacity:1;}
.sb-social:has([data-sb-celestial-environment]) [data-sb-moment]:has([data-sb-resonate-attending="1"])::before {opacity:.42;}
.sb-social:has([data-sb-celestial-environment]) [data-sb-moment]:has([data-sb-resonate-pressing="1"])::before {opacity:.7;}
.sb-celestial-field{--sb-depth-x:0px;--sb-depth-y:0px;}
.sb-celestial-field [data-sb-depth-sky]{transform:translate3d(calc(var(--sb-depth-x) * .7),calc(var(--sb-depth-y) * .7),0);transition:transform 300ms cubic-bezier(.22,1,.36,1);}
html[data-theme="light"] .sb-social:has([data-sb-celestial-environment]) {
  background-color:#f3f6f7;
  background-image:url('/celestial/environment-solar.svg'),radial-gradient(ellipse at 12% 0%,#edf7ff,transparent 75%),linear-gradient(130deg,#f5f9fc,#fffdf6 60%,#e8edf1);
  background-size:100% auto,auto,auto;
  background-repeat:no-repeat;
}
html[data-theme="light"] .sb-social:has([data-sb-celestial-environment]) [data-sb-sheet] {
  background:linear-gradient(125deg,#ffffffed,#f8fcfbed 65%,#fdf8edeb);
  box-shadow:0 1px 0 #fff inset,0 16px 52px #65502b12,0 0 0 1px #a68b541b;
}
html[data-theme="light"] .sb-social:has([data-sb-celestial-environment]) [data-sb-moment]::before {
  background:radial-gradient(ellipse at 8% 78%,#f2ce8260,transparent 62%),radial-gradient(ellipse at 94% 50%,#9dcbe64d,transparent 68%),linear-gradient(165deg,#ffffff00,#fffffff0 55%,#e4edf299);
  box-shadow:none;
}
@media(prefers-reduced-motion:reduce){
.sb-social:has([data-sb-celestial-environment]){transition-duration:150ms;}
.sb-social:has([data-sb-celestial-environment]) [data-sb-moment]::before {transition:opacity 150ms linear;}
.sb-celestial-field *, .sb-resonate * {animation:none!important;transition-duration:150ms!important;}
}
`}</style></span>;
}
