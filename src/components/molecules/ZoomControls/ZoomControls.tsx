'use client';

import React from 'react';
import Button from '@/components/atoms/Button';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFit: () => void;
  minZoom?: number;
  maxZoom?: number;
}

export default function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  onFit,
}: ZoomControlsProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="font-semibold text-xs text-gray-600 mb-2">🔍 Zoom</p>
      <div className="flex items-center gap-2">
        <button
          onClick={onZoomOut}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm font-bold"
          title="Zoom out"
        >
          −
        </button>
        <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm font-bold"
          title="Zoom in"
        >
          +
        </button>
        <Button onClick={onReset} variant="secondary" size="sm">
          100%
        </Button>
      </div>
      <Button onClick={onFit} variant="secondary" size="sm" className="mt-2 w-full">
        Fit board
      </Button>
    </div>
  );
}
