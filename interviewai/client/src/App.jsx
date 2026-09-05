import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { InterviewProvider } from './context/InterviewContext.jsx'
import Navbar from './components/layout/Navbar.jsx'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Setup from './pages/Setup.jsx'
import Interview from './pages/Interview.jsx'
import CodingRound from './pages/CodingRound.jsx'
import Report from './pages/Report.jsx'
import Loader from './components/ui/Loader.jsx'

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen hero-bg flex items-center justify-center">
        <Loader size="lg" text="Loading..." />
      </div>
    )
  }
  return user ? children : <Navigate to="/login" replace />
}

// Hide navbar on interview/coding pages
function Layout({ children }) {
  const hideNav = window.location.pathname.startsWith('/interview/') ||
    window.location.pathname.startsWith('/coding/')
  return (
    <>
      {!hideNav && <Navbar />}
      {children}
    </>
  )
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
        <Route path="/interview/:sessionId" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
        <Route path="/coding/:sessionId" element={<ProtectedRoute><CodingRound /></ProtectedRoute>} />
        <Route path="/report/:sessionId" element={<ProtectedRoute><Report /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

import { GoogleOAuthProvider } from '@react-oauth/google'

export default function App() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'placeholder_for_google_client_id'

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <AuthProvider>
          <InterviewProvider>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1e2a4a',
                  color: '#f1f5f9',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '14px',
                },
                success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />
          </InterviewProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}
