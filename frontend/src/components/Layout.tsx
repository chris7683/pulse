import { Link, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import PulseMark from '../images/P PULSE BLACK-05.png'

export default function Layout() {
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Fixed and glass morphism */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-foreground flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                <img 
                  src={PulseMark} 
                  alt="Pulse Productions" 
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-black text-lg tracking-tight leading-none">Pulse</span>
                <span className="text-xs text-muted-foreground">Prom Booking</span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-2 md:gap-4">
              <Link to="/">
                <Button 
                  variant={location.pathname === '/' ? 'default' : 'ghost'}
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  <Sparkles className="w-4 h-4" />
                  Proms
                </Button>
              </Link>
              
              <Link to="/admin/login">
                <Button 
                  variant={location.pathname.startsWith('/admin') ? 'default' : 'ghost'}
                  size="sm"
                >
                  Admin
                </Button>
              </Link>

              <ThemeToggle />
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className={`flex-1 ${isHomePage ? '' : 'pt-20 md:pt-24'}`}>
        <Outlet />
      </main>

      {/* Footer - Only show on non-home pages or at bottom */}
      {!isHomePage && (
        <footer className="border-t border-border/50 bg-card/30 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                  <img 
                    src={PulseMark} 
                    alt="Pulse Productions" 
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} Pulse Productions. All rights reserved.
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <Link 
                  to="/" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Proms
                </Link>
                <Link 
                  to="/admin/login" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
