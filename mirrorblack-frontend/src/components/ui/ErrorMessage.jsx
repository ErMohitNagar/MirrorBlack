export const ErrorMessage = ({ message, className = '' }) => {
  if (!message) return null
  return (
    <div className={`text-[#8b2020] text-sm font-mono mt-2 mb-4 ${className}`}>
      {message}
    </div>
  )
}
