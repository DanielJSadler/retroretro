'use client'

import { useId, useState } from 'react'

interface PasswordFieldProps {
  autoComplete: 'current-password' | 'new-password'
  label: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  value: string
}

export default function PasswordField({
  autoComplete,
  label,
  onChange,
  placeholder = '••••••••',
  required = true,
  value,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false)
  const inputId = useId()

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setIsVisible(visible => !visible)}
          className="text-xs font-semibold text-purple-600 hover:underline"
          aria-pressed={isVisible}
        >
          {isVisible ? 'Hide' : 'Show'} password
        </button>
      </div>
      <input
        id={inputId}
        type={isVisible ? 'text' : 'password'}
        value={value}
        onChange={event => onChange(event.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="w-full p-3"
        placeholder={placeholder}
      />
    </div>
  )
}
