'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'

export default function ForgotPasswordPage() {
  const { signIn } = useAuthActions()
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSending(true)

    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('flow', 'reset')
      formData.append('redirectTo', '/reset-password')
      await signIn('password', formData)
    } catch (error) {
      // Keep the response neutral so this page does not reveal which email addresses have accounts.
      console.error('Password reset request failed:', error)
    } finally {
      setIsSending(false)
      setIsSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 w-full max-w-md">
        <h1 className="text-3xl text-center mb-8">🎮 Retro Retro</h1>
        <h2 className="text-xl text-center mb-3">Reset your password</h2>

        {isSent ? (
          <div className="space-y-6 text-center">
            <p className="rounded border-2 border-green-500 bg-green-50 p-4 text-sm text-green-800">
              If an account uses that email address, a password reset link is on its way.
            </p>
            <Link href="/login" className="text-purple-600 hover:underline font-semibold">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-center text-sm text-gray-600">Enter your email and we&apos;ll send a reset link.</p>
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
            <button
              type="submit"
              disabled={isSending}
              className="w-full bg-blue-600 text-white py-3 font-semibold hover:translate-y-0.5 transition-transform disabled:opacity-50"
            >
              {isSending ? 'Sending...' : 'Send reset link'}
            </button>
            <p className="text-center text-sm text-gray-600">
              <Link href="/login" className="text-purple-600 hover:underline font-semibold">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
