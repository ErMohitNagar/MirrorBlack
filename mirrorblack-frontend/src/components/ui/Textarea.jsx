import { forwardRef } from 'react'

export const Textarea = forwardRef(({ className = '', error, ...props }, ref) => {
  return (
    <div className="w-full h-full flex flex-col">
      <textarea
        ref={ref}
        className={`w-full flex-grow bg-transparent border-none text-white placeholder-white-faint focus:outline-none focus:ring-0 resize-none font-mono text-lg leading-relaxed ${className}`}
        {...props}
      />
      {error && <span className="text-[#8b2020] text-sm mt-1 block">{error}</span>}
    </div>
  )
})
