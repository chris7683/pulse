import { Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import PromDetailPage from './pages/PromDetailPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderStatusPage from './pages/OrderStatusPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import SplashScreen from './components/SplashScreen'

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [contentReady, setContentReady] = useState(false)

  useEffect(() => {
    // Start fade out after 3 seconds
    const fadeTimer = setTimeout(() => setShowSplash(false), 3000)
    // Show content after splash starts fading (to prevent overlap issues)
    const contentTimer = setTimeout(() => setContentReady(true), 3000)
    
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(contentTimer)
    }
  }, [])

  return (
    <ThemeProvider defaultTheme="dark" storageKey="pulse-theme">
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>
      {contentReady && (
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="prom/:id" element={<PromDetailPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="order/:referenceCode" element={<OrderStatusPage />} />
          </Route>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      )}
    </ThemeProvider>
  )
}

export default App
