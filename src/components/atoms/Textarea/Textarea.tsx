'use client';

import React from 'react';

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export default function Textarea({
  className = '',
  error,
  ...props
}: TextareaProps) {
  return (
    <textarea
      className={`w-full px-3 py-2 border rounded-lg text-black resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
        error ? 'border-red-500' : 'border-gray-300'
      } ${className}`}
      {...props}
    />
  );
}
