import { Link } from 'react-router-dom'

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-6">
      <div className="text-center">
        <p className="font-mono text-white-muted text-lg mb-8">This does not exist.</p>
        <Link to="/dashboard" className="font-mono text-sm text-white hover:text-accent transition-colors underline underline-offset-4">
          Return
        </Link>
      </div>
    </div>
  )
}
