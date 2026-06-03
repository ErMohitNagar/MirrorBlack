import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authApi } from '../api/auth.api'
import { useAuth } from '../hooks/useAuth'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { ErrorMessage } from '../components/ui/ErrorMessage'

export const Register = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const password = watch('password', '')
  
  const reqs = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  }

  const onSubmit = async (data) => {
    if (!reqs.length || !reqs.upper || !reqs.number || !reqs.special) return
    setLoading(true)
    setError(null)
    try {
      const res = await authApi.register(data)
      navigate('/verify-otp', {
        state: { userId: res.userId }
      })
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to connect. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 md:px-0">
      <div className="w-full max-w-[400px] mx-auto">
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl text-white tracking-widest mb-4">MIRRORBLACK</h1>
          <p className="font-mono text-sm text-white-muted tracking-wide">It does not comfort. It reflects.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            type="email"
            placeholder="Email"
            error={errors.email?.message}
            {...register('email', { required: 'Email is required' })}
          />
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              {...register('password', { required: 'Password is required' })}
            />
            <button
              type="button"
              className="absolute right-4 top-3.5 font-mono text-xs text-white-muted hover:text-white transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'HIDE' : 'SHOW'}
            </button>
          </div>

          <div className="font-mono text-xs space-y-2 mt-4 pl-1">
            <div className={reqs.length ? 'text-white' : 'text-white-faint'}>[ {reqs.length ? 'x' : ' '} ] 8+ characters</div>
            <div className={reqs.upper ? 'text-white' : 'text-white-faint'}>[ {reqs.upper ? 'x' : ' '} ] Uppercase letter</div>
            <div className={reqs.number ? 'text-white' : 'text-white-faint'}>[ {reqs.number ? 'x' : ' '} ] Number</div>
            <div className={reqs.special ? 'text-white' : 'text-white-faint'}>[ {reqs.special ? 'x' : ' '} ] Special character</div>
          </div>

          <ErrorMessage message={error} />

          <Button 
            type="submit" 
            className="w-full mt-8" 
            isLoading={loading}
            disabled={!reqs.length || !reqs.upper || !reqs.number || !reqs.special}
          >
            Create Account
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/login" className="font-mono text-sm text-white-muted hover:text-white transition-colors underline underline-offset-4">
            Already here. Sign in.
          </Link>
        </div>
      </div>
    </div>
  )
}
