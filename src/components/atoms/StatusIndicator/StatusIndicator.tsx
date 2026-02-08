'use client';

import React from 'react';

interface StatusIndicatorProps {
  isActive?: boolean;
  className?: string;
}

export default function StatusIndicator({
  isActive = true,
  className = '',
}: StatusIndicatorProps) {
  return (
    <div
      className={`w-2 h-2 rounded-full ${
        isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
      } ${className}`}
    />
  );
}
