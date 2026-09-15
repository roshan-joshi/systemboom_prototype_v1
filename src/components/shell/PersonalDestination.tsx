"use client";

/**
 * A personal destination (Social, Life) needs an identity. If there is none,
 * the request is remembered and the person is taken to the root of the
 * application, where identity lives — and continued to what they asked for
 * once they are in. They never have to ask twice, and nothing is decided for
 * them.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useIdentity } from "@/components/identity/IdentityProvider";
import { byId } from "./destinations";
import { rememberIntent } from "./intent";

export function PersonalDestination({ id, children }: { id: string; children: ReactNode }) {
  const identity = useIdentity();
  const router = useRouter();
  const sent = useRef(false);
  const needsIdentity = identity.hydrated && !identity.activeIdentity;

  useEffect(() => {
    if (!needsIdentity || sent.current) return;
    sent.current = true;
    rememberIntent(id);
    router.replace("/?identity=1");
  }, [needsIdentity, id, router]);

  if (!identity.hydrated || needsIdentity) {
    return (
      <div className="sb-surface flex min-h-dvh items-center justify-center px-6 text-center" data-sb-awaiting-identity={id}>
        <p className="max-w-[34ch] text-[14px] leading-[1.6] text-muted">
          {needsIdentity ? `${byId(id).label} is yours once you have entered SYSTEMBOOM. Opening your identity…` : " "}
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
