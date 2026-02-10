'use client';

import { ThemeProvider } from '@/context/ThemeProvider';
import { ConvexClientProvider } from '@/components/providers/ConvexClientProvider';
import { StandardModeProvider } from '@/context/StandardModeContext';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexClientProvider>
      <ThemeProvider>
        <StandardModeProvider>
          {children}
        </StandardModeProvider>
      </ThemeProvider>
    </ConvexClientProvider>
  );
}
