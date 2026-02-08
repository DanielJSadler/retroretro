'use client';

import { ThemeProvider } from '@/context/ThemeProvider';
import { ConvexClientProvider } from '@/components/providers/ConvexClientProvider';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexClientProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </ConvexClientProvider>
  );
}
