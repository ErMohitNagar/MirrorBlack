import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { authApi } from '../api/auth.api'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { ErrorMessage } from '../components/ui/ErrorMessage'

export const VerifyOtp = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const inputRefs = useRef([])
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const userId = location.state?.userId

  useEffect(() => {
    if (!userId) {
      navigate('/register')
    }
  }, [userId, navigate])

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleChange = (e, index) => {
    const value = e.target.value
    if (!/^[0-9]*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.substring(value.length - 1)
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1].focus()
    }

    if (newOtp.every(v => v !== '')) {
      submitOtp(newOtp.join(''))
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    if (!pastedData) return

    const newOtp = [...otp]
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i]
    }
    setOtp(newOtp)

    if (pastedData.length === 6) {
      inputRefs.current[5].focus()
      submitOtp(newOtp.join(''))
    } else {
      inputRefs.current[pastedData.length].focus()
    }
  }

  const submitOtp = async (otpCode) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authApi.verifyOtp(userId, otpCode)
      login(res.token, res.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setError(null)
    try {
      await authApi.resendOtp(userId)
      setCooldown(60)
    } catch (err) {
      if (err.response?.status === 429) {
        const remaining = parseInt(err.response.data.error.match(/\d+/)?.[0] || '60')
        setCooldown(remaining)
        setError(err.response.data.error)
      } else {
        setError(err.response?.data?.error || 'Failed to resend code.')
      }
    }
  }

  if (!userId) return null

  return (
    <div className="min-h-screen flex items-center justify-center px-6 md:px-0">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl text-white tracking-widest mb-4">MIRRORBLACK</h1>
          <p className="font-mono text-sm text-white-muted tracking-wide">A code was sent to your email.</p>
        </div>

        <div className="space-y-6 flex flex-col items-center">
          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(e, index)}
                onKeyDown={e => handleKeyDown(e, index)}
                className="w-11 h-13 bg-transparent border-b border-white-faint text-center text-xl font-mono text-white focus:outline-none focus:border-white transition-colors"
                autoFocus={index === 0}
                disabled={loading}
              />
            ))}
          </div>

          <ErrorMessage message={error} />

          {loading && <p className="font-mono text-sm text-white-muted animate-pulse">Verifying...</p>}

          <div className="mt-8">
            <button
              onClick={handleResend}
              disabled={cooldown > 0 || loading}
              className={`font-mono text-sm underline underline-offset-4 transition-colors \${
                cooldown > 0 ? 'text-white-faint cursor-not-allowed' : 'text-white-muted hover:text-white'
              }`}
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
