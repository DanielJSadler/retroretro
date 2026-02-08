'use client';

import React from 'react';
import { NoteColor } from '@/types';

const sectionColors: { value: NoteColor; class: string }[] = [
  { value: 'green', class: 'bg-green-200' },
  { value: 'pink', class: 'bg-pink-200' },
  { value: 'blue', class: 'bg-blue-200' },
  { value: 'yellow', class: 'bg-yellow-200' },
  { value: 'red', class: 'bg-red-200' },
];

interface ColorPickerProps {
  value: NoteColor;
  onChange: (color: NoteColor) => void;
  className?: string;
}

export default function ColorPicker({
  value,
  onChange,
  className = '',
}: ColorPickerProps) {
  return (
    <div className={`flex gap-1 ${className}`}>
      {sectionColors.map((color) => (
        <button
          key={color.value}
          type="button"
          onClick={() => onChange(color.value)}
          className={`w-5 h-5 rounded transition-all ${color.class} ${
            value === color.value
              ? 'ring-2 ring-gray-800 scale-110'
              : 'ring-1 ring-gray-300 hover:scale-105'
          }`}
          aria-label={`Select ${color.value} color`}
        />
      ))}
    </div>
  );
}

export { sectionColors };
