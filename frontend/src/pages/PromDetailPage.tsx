import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Minus, Plus, ShoppingCart } from 'lucide-react'
import client from '../api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface TicketType {
  id: number
  name: string
  price: number
  description?: string
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

export default function PromDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [prom, setProm] = useState<Prom | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTickets, setSelectedTickets] = useState<Record<number, number>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProm()
  }, [id])

  async function loadProm() {
    try {
      setLoading(true)
      const { data } = await client.get(`/proms/${id}`)
      setProm(data)
      const initial: Record<number, number> = {}
      data.ticketTypes.forEach((tt: TicketType) => {
        initial[tt.id] = 0
      })
      setSelectedTickets(initial)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prom')
    } finally {
      setLoading(false)
    }
  }

  function updateQuantity(ticketTypeId: number, delta: number) {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketTypeId]: Math.max(0, Math.min(10, (prev[ticketTypeId] || 0) + delta))
    }))
  }

  function getTotal() {
    if (!prom) return 0
    return prom.ticketTypes.reduce((sum, tt) => {
      const qty = selectedTickets[tt.id] || 0
      return sum + (tt.price * qty)
    }, 0)
  }

  function getTotalQuantity() {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0)
  }

  function handleCheckout() {
    const items = prom!.ticketTypes
      .filter(tt => selectedTickets[tt.id] > 0)
      .map(tt => ({
        ticketTypeId: tt.id,
        quantity: selectedTickets[tt.id]
      }))

    if (items.length === 0) {
      alert('Please select at least one ticket')
      return
    }

    navigate('/checkout', {
      state: { prom, items }
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (error || !prom) {
    return (
      <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-screen">
        <Card className="max-w-md border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error || 'Prom not found'}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Event Header */}
        <Card className="mb-8 overflow-hidden border-2">
          <div className="h-2 bg-gradient-to-r from-primary to-secondary" />
          <CardHeader className="space-y-4">
            <div>
              <CardTitle className="text-3xl md:text-4xl mb-3">{prom.name}</CardTitle>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {new Date(prom.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {prom.venue} • {prom.city}
                </span>
              </div>
            </div>
            {prom.description && (
              <CardDescription className="text-base">
                {prom.description}
              </CardDescription>
            )}
          </CardHeader>
        </Card>

        {/* Ticket Selection */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold mb-4">Select Tickets</h2>
            {prom.ticketTypes.map((tt) => (
              <motion.div
                key={tt.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{tt.name}</CardTitle>
                        {tt.description && (
                          <CardDescription className="mt-1">{tt.description}</CardDescription>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        ${tt.price.toFixed(2)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Quantity:</span>
                    <div className="flex items-center gap-3">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(tt.id, -1)}
                        disabled={!selectedTickets[tt.id]}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-lg font-semibold w-8 text-center">
                        {selectedTickets[tt.id] || 0}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(tt.id, 1)}
                        disabled={selectedTickets[tt.id] >= 10}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Checkout Summary - Sticky */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-2">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Tickets:</span>
                    <span className="font-semibold">{getTotalQuantity()}</span>
                  </div>
                  <div className="flex justify-between text-lg pt-2 border-t">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="font-bold text-primary text-2xl">
                      ${getTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={getTotalQuantity() === 0}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Proceed to Checkout
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
