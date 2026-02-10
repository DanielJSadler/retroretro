'use client';

import React from 'react';
import { Phase } from '@/types';

export type BadgeVariant = 'default' | 'phase';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  phase?: Phase;
  className?: string;
}

const phaseColors: Record<Phase, string> = {
  writing: 'bg-blue-100 text-blue-800',
  reveal: 'bg-green-100 text-green-800',
  voting: 'bg-orange-100 text-orange-800',
  discussion: 'bg-purple-100 text-purple-800',
  finished: 'bg-gray-100 text-gray-800',
};

export default function Badge({
  children,
  variant = 'default',
  phase,
  className = '',
}: BadgeProps) {
  const baseClasses = 'text-xs px-2 py-0.5 rounded-full capitalize';

  if (variant === 'phase' && phase) {
    return (
      <span className={`${baseClasses} ${phaseColors[phase]} ${className}`}>
        {children}
      </span>
    );
  }

  return (
    <span className={`${baseClasses} bg-gray-100 text-gray-800 ${className}`}>
      {children}
    </span>
  );
}
