import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export const Navbar = () => {
  const { logout } = useAuth()

  return (
    <nav className="flex items-center justify-between py-6 px-6 md:px-0 max-w-[680px] mx-auto w-full">
      <Link to="/dashboard" className="font-display text-xl text-white hover:text-white-muted transition-colors tracking-wide">
        MIRRORBLACK
      </Link>
      <button 
        onClick={logout} 
        className="font-mono text-sm text-white-muted hover:text-white transition-colors bg-transparent border-none"
      >
        Logout
      </button>
    </nav>
  )
}
