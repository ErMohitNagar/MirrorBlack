import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ui/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'

import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { VerifyOtp } from './pages/VerifyOtp'
import { Dashboard } from './pages/Dashboard'
import { NewEntry } from './pages/NewEntry'
import { EntryDetail } from './pages/EntryDetail'
import { NotFound } from './pages/NotFound'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/entries/new" element={<NewEntry />} />
              <Route path="/entries/:id" element={<EntryDetail />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
