import { forwardRef } from 'react'

export const Input = forwardRef(({ className = '', error, ...props }, ref) => {
  return (
    <div className="w-full">
      <input
        ref={ref}
        className={`w-full bg-black-soft border border-black-border rounded-sm py-3 px-4 text-white placeholder-white-faint focus:outline-none focus:border-accent font-mono transition-colors ${error ? 'border-[#8b2020]' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-[#8b2020] text-sm mt-1 block">{error}</span>}
    </div>
  )
})
