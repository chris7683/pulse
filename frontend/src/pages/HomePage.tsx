import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Sparkles, ArrowRight, Ticket } from 'lucide-react'
import client from '../api/client'
import { FullScreenSection } from '@/components/ui/full-screen-section'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import PulseLogoFull from '../images/FULL PULSE PRODUCTIONS LOGO BLACK-04.png'

interface TicketType {
  id: number
  name: string
  price: number
  available: number
}

interface Prom {
  id: number
  name: string
  venue: string
  city: string
  date: string
  description?: string
  ticketTypes: TicketType[]
}

export default function HomePage() {
  const [proms, setProms] = useState<Prom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('hero')

  useEffect(() => {
    loadProms()
  }, [])

  // Simple and accurate scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'proms', 'features']
      const scrollPosition = window.scrollY + 200 // Offset for better detection

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i])
        if (element && scrollPosition >= element.offsetTop) {
          if (activeSection !== sections[i]) {
            setActiveSection(sections[i])
          }
          break
        }
      }
    }

    handleScroll() // Initial check
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [activeSection])

  async function loadProms() {
    try {
      setLoading(true)
      const { data } = await client.get('/proms')
      setProms(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load proms')
    } finally {
      setLoading(false)
    }
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      {/* Section Navigation - Simple and Clean */}
      <nav className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-4">
        {[
          { id: 'hero', label: 'Home' },
          { id: 'proms', label: 'Proms' },
          { id: 'features', label: 'Features' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => scrollToSection(id)}
            className="group relative flex items-center justify-end"
            aria-label={`Go to ${label}`}
          >
            <span className="absolute right-8 bg-card text-card-foreground px-3 py-1 rounded-lg text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg border border-border">
              {label}
            </span>
            <div
              className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                activeSection === id
                  ? 'bg-primary border-primary scale-125 shadow-lg shadow-primary/50'
                  : 'bg-background border-muted-foreground/30 group-hover:border-primary/50 group-hover:scale-110'
              }`}
            />
          </button>
        ))}
      </nav>

      {/* Hero Section */}
      <FullScreenSection id="hero" background="gradient">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center space-y-8"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex justify-center mb-8"
            >
              <img 
                src={PulseLogoFull} 
                alt="Pulse Productions" 
                className="h-16 md:h-20 w-auto drop-shadow-2xl dark:drop-shadow-[0_0_30px_rgba(255,75,154,0.3)]"
              />
            </motion.div>

            {/* Main Heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="space-y-4"
            >
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter">
                <span className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                  Your Perfect
                </span>
                <br />
                <span className="text-foreground">Prom Night</span>
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Secure your tickets to unforgettable prom experiences. 
                Book now and create memories that last forever.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button
                size="xl"
                onClick={() => document.getElementById('proms')?.scrollIntoView({ behavior: 'smooth' })}
                className="group"
              >
                <Sparkles className="w-5 h-5" />
                Browse Proms
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="xl" variant="outline">
                <Ticket className="w-5 h-5" />
                Check Order Status
              </Button>
            </motion.div>
          </motion.div>

          {/* Floating Decorations */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 5, 0],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{ 
                y: [0, 20, 0],
                rotate: [0, -5, 0],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"
            />
          </div>
        </div>
      </FullScreenSection>

      {/* Proms Section */}
      <FullScreenSection id="proms" background="default" className="!min-h-fit py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-4">
              Available <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Proms</span>
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
              Choose from our curated selection of premium prom events
            </p>
          </motion.div>

          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 min-h-[400px]">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-muted-foreground">Loading amazing proms...</p>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center min-h-[400px]">
              <Card className="max-w-md border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">Error Loading Proms</CardTitle>
                  <CardDescription>{error}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button onClick={loadProms} variant="outline" className="w-full">
                    Try Again
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {proms.map((prom, index) => (
                <motion.div
                  key={prom.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link to={`/prom/${prom.id}`} className="block group">
                    <Card className="h-full border-2 group-hover:border-primary/50 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-primary/20 overflow-hidden group-hover:scale-[1.03] will-change-transform">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                          <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                            <Sparkles className="w-3 h-3" />
                            Featured
                          </span>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(prom.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                          {prom.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 text-base">
                          <MapPin className="w-4 h-4" />
                          {prom.venue} • {prom.city}
                        </CardDescription>
                      </CardHeader>

                      {prom.description && (
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {prom.description}
                          </p>
                        </CardContent>
                      )}

                      <CardFooter className="flex items-center justify-between mt-auto pt-6">
                        <div className="text-left">
                          <p className="text-xs text-muted-foreground mb-1">Starting from</p>
                          <p className="text-2xl font-bold">
                            ${Math.min(...prom.ticketTypes.map(tt => tt.price)).toFixed(2)}
                          </p>
                        </div>
                        <Button className="group-hover:scale-110 transition-transform">
                          View Details
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </FullScreenSection>

      {/* Features Section */}
      <FullScreenSection id="features" background="card" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
              Why Choose <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Pulse?</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We make booking your prom tickets simple, secure, and unforgettable
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Ticket,
                title: 'Secure Booking',
                description: 'Bank transfer verification ensures your payment is safe and secure',
              },
              {
                icon: Sparkles,
                title: 'Premium Events',
                description: 'Curated selection of the best prom venues and experiences',
              },
              {
                icon: Calendar,
                title: 'Easy Management',
                description: 'Track your order status and manage tickets with ease',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
              >
                <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300 hover:scale-105 text-center">
                  <CardHeader>
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                      <feature.icon className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </FullScreenSection>
    </>
  )
}
