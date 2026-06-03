export const Button = ({ children, isLoading, className = '', variant = 'primary', ...props }) => {
  const baseClasses = "font-medium py-3 px-6 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-mono"
  
  const variants = {
    primary: "bg-white text-black hover:bg-accent hover:text-white",
    outline: "bg-transparent border border-white-faint text-white hover:border-white hover:text-white",
    ghost: "bg-transparent text-white-muted hover:text-white px-0 py-0"
  }

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <span className="animate-pulse">Loading...</span> : children}
    </button>
  )
}
