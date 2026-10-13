"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/features/planning-poker/components/atoms/Toast";
import { ThemeProvider } from "@/features/planning-poker/hooks/useTheme";
import "@/features/planning-poker/poker.css";

export default function PlanningPokerLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
