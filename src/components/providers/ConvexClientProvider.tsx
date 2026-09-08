"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <ConvexAuthProvider
        client={convex}
        shouldHandleCode={() => typeof window === "undefined" || !window.location.pathname.startsWith("/reset-password")}
      >
        {children}
      </ConvexAuthProvider>
    </ConvexProvider>
  );
}
