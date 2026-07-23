import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { session, sessionReady, loading } = useAuth()

  if (loading || !sessionReady) {
    return <div className="flex h-screen items-center justify-center">Initialising session…</div>
  }

  return session ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </AuthProvider>
  )
}