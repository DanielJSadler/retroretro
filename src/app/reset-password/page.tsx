'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthActions } from '@convex-dev/auth/react'
import PasswordField from '@/components/molecules/PasswordField'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { signIn } = useAuthActions()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  useEffect(() => {
    setCode(new URLSearchParams(window.location.search).get('code') ?? '')
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!code) {
      setError('This reset link is missing its code. Request a new one and try again.')
      return
    }

    setIsResetting(true)
    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('code', code)
      formData.append('newPassword', newPassword)
      formData.append('flow', 'reset-verification')
      await signIn('password', formData)
      router.replace('/')
    } catch (resetError) {
      console.error('Password reset failed:', resetError)
      setError('That reset link is invalid or has expired. Request a new one and try again.')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 w-full max-w-md">
        <h1 className="text-3xl text-center mb-8">🎮 Retro Retro</h1>
        <h2 className="text-xl text-center mb-6">Choose a new password</h2>

        {error && <div className="mb-4 p-3 bg-red-100 border-3 border-red-500 text-red-700 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reset-email" className="block text-sm font-semibold mb-2 text-gray-700">
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              required
              autoComplete="email"
              className="w-full p-3"
              placeholder="your@email.com"
            />
          </div>

          <PasswordField
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />
          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={isResetting}
            className="w-full bg-blue-600 text-white py-3 font-semibold hover:translate-y-0.5 transition-transform disabled:opacity-50"
          >
            {isResetting ? 'Resetting...' : 'Reset password'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          <Link href="/forgot-password" className="text-purple-600 hover:underline font-semibold">
            Request a new reset link
          </Link>
        </p>
      </div>
    </div>
  )
}
