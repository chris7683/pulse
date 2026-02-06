import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, X, CheckCircle2, FileText } from 'lucide-react'
import client from '../api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface TicketType {
  id: number
  name: string
  price: number
}

interface Prom {
  id: number
  name: string
  ticketTypes: TicketType[]
}

interface CheckoutItem {
  ticketTypeId: number
  quantity: number
}

export default function CheckoutPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { prom, items } = (location.state as { prom: Prom; items: CheckoutItem[] }) || {}

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  })
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  if (!prom || !items) {
    return (
      <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-screen">
        <Card className="max-w-md border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">No Items Selected</CardTitle>
            <CardDescription>Please go back and select tickets.</CardDescription>
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload an image (JPEG, PNG) or PDF file')
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size must be less than 5MB')
      return
    }

    setPaymentProof(file)
    setError(null)

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPaymentProofPreview(null)
    }
  }

  function removeFile() {
    setPaymentProof(null)
    setPaymentProofPreview(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!paymentProof) {
      setError('Please upload a photo of your bank transaction')
      setLoading(false)
      return
    }

    try {
      const { data } = await client.post('/orders', {
        promId: prom.id,
        ...formData,
        items
      })

      const formDataUpload = new FormData()
      formDataUpload.append('file', paymentProof)

      try {
        await client.post(`/upload/payment-proof/${data.order.id}`, formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } catch (uploadErr) {
        console.error('Failed to upload payment proof:', uploadErr)
      }

      setShowSuccessModal(true)
      setTimeout(() => {
        navigate('/', { replace: true })
      }, 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || err.message || 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  const total = items.reduce((sum, item) => {
    const ticketType = prom.ticketTypes.find(tt => tt.id === item.ticketTypeId)
    return sum + (ticketType ? ticketType.price * item.quantity : 0)
  }, 0)

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-black mb-8">Checkout</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map(item => {
                  const ticketType = prom.ticketTypes.find(tt => tt.id === item.ticketTypeId)
                  if (!ticketType) return null
                  return (
                    <div key={item.ticketTypeId} className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold">{ticketType.name}</span>
                        <span className="text-muted-foreground ml-2">× {item.quantity}</span>
                      </div>
                      <span className="font-semibold">
                        ${(ticketType.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  )
                })}
                <div className="flex justify-between items-center pt-3 border-t text-lg">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-primary text-2xl">${total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="customerName" className="text-sm font-medium">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    required
                    minLength={2}
                    maxLength={100}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="customerEmail" className="text-sm font-medium">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="customerEmail"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="customerPhone" className="text-sm font-medium">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    id="customerPhone"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    required
                    minLength={10}
                    maxLength={20}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Proof */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Proof</CardTitle>
                <CardDescription>
                  Upload a photo or screenshot of your bank transaction showing the payment. 
                  Accepted formats: JPEG, PNG, or PDF (max 5MB).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!paymentProof ? (
                  <label
                    htmlFor="paymentProof"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center py-6">
                      <Upload className="w-12 h-12 text-muted-foreground mb-3" />
                      <p className="mb-2 text-sm">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">JPEG, PNG, or PDF (max 5MB)</p>
                    </div>
                    <input
                      id="paymentProof"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={handleFileChange}
                      required
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="space-y-4">
                    {paymentProofPreview ? (
                      <div className="relative w-full h-64 rounded-lg overflow-hidden border border-border">
                        <img
                          src={paymentProofPreview}
                          alt="Payment proof preview"
                          className="w-full h-full object-contain bg-muted"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full h-32 rounded-lg border border-border bg-muted">
                        <FileText className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-accent">
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{paymentProof.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(paymentProof.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={removeFile}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {error && (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="pt-6">
                  <p className="text-destructive text-sm">{error}</p>
                </CardContent>
              </Card>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : 'Create Order'}
            </Button>
          </form>
        </motion.div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md mx-4"
          >
            <Card className="border-2 border-primary shadow-2xl">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">Order Placed Successfully!</CardTitle>
                <CardDescription>
                  Your order has been placed. Please wait for a confirmation email.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  You will be redirected to the home page shortly...
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={() => navigate('/', { replace: true })} className="w-full">
                  Go to Home
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      )}
    </>
  )
}
