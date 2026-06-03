import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authApi } from '../api/auth.api'
import { useAuth } from '../hooks/useAuth'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { ErrorMessage } from '../components/ui/ErrorMessage'

export const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (data) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authApi.login(data)
      login(res.token, res.user)
      navigate('/dashboard')
    } catch (err) {
      if (err.response?.status === 403) {
        navigate('/verify-otp', {
          state: { userId: err.response.data.userId }
        })
        return
      }
      setError(err.response?.data?.error || 'Unable to connect. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 md:px-0">
      <div className="w-full max-w-[400px]">
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
              error={errors.password?.message}
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

          <ErrorMessage message={error} />

          <Button type="submit" className="w-full mt-8" isLoading={loading}>
            Sign In
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/register" className="font-mono text-sm text-white-muted hover:text-white transition-colors underline underline-offset-4">
            No account. Create one.
          </Link>
        </div>
      </div>
    </div>
  )
}
