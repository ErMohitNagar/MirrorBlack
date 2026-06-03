import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-[680px] mx-auto px-6 md:px-0 pb-20">
        <Outlet />
      </main>
    </div>
  )
}
