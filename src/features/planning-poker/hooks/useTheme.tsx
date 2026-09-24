"use client";

import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <div
      id="planning-poker"
      className="dark min-h-screen bg-slate-950 text-slate-100"
      style={{ colorScheme: "dark" }}
    >
      {children}
    </div>
  );
}
