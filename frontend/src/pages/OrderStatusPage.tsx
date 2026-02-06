import { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, Calendar, MapPin, User, Mail, Phone, ExternalLink } from 'lucide-react'
import client from '../api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface TicketType {
  id: number
  name: string
  price: number
}

interface OrderItem {
  ticketType: TicketType
  quantity: number
  subtotal: number
}

interface PaymentProof {
  fileName: string
  uploadedAt: string
}

interface Order {
  id: number
  referenceCode: string
  status: string
  customerName: string
  customerEmail: string
  customerPhone: string
  totalAmount: number
  createdAt: string
  prom: {
    name: string
    date: string
    venue: string
  }
  items: OrderItem[]
  paymentProof?: PaymentProof
  tickets?: any[]
}

interface BankDetails {
  bankName: string
  accountNumber: string
  accountName: string
  swiftCode: string
}

export default function OrderStatusPage() {
  const { referenceCode } = useParams<{ referenceCode: string }>()
  const location = useLocation()
  const [order, setOrder] = useState<Order | null>(location.state?.order || null)
  const [bankDetails] = useState<BankDetails | null>(location.state?.bankDetails || null)
  const [loading, setLoading] = useState(!order)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (!order) {
      loadOrder()
    }
  }, [referenceCode])

  async function loadOrder() {
    try {
      setLoading(true)
      const { data } = await client.get(`/orders/${referenceCode}`)
      setOrder(data)
    } catch (err) {
      console.error('Failed to load order:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !order) return

    setUploading(true)
    setUploadError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      await client.post(`/upload/payment-proof/${order.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      alert('Payment proof uploaded successfully!')
      setFile(null)
      loadOrder()
    } catch (err: any) {
      setUploadError(err.response?.data?.error || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-500/10 text-green-500 border-green-500/50'
      case 'REJECTED':
        return 'bg-destructive/10 text-destructive border-destructive/50'
      case 'PENDING_VERIFICATION':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50'
      default:
        return 'bg-muted text-muted-foreground border-muted'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-screen">
        <Card className="max-w-md border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Order Not Found</CardTitle>
            <CardDescription>The order reference code is invalid or expired.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <h1 className="text-4xl font-black">Order Status</h1>

        {/* Order Card */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Order #{order.referenceCode}</CardTitle>
                <CardDescription>
                  {new Date(order.createdAt).toLocaleString()}
                </CardDescription>
              </div>
              <div className={cn('px-4 py-2 rounded-lg border-2 font-semibold text-sm', getStatusColor(order.status))}>
                {order.status.replace('_', ' ')}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event Details */}
            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Event Details
              </h3>
              <div className="space-y-1 ml-7">
                <p className="font-semibold text-lg">{order.prom.name}</p>
                <p className="text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {new Date(order.prom.date).toLocaleDateString()} • {order.prom.venue}
                </p>
              </div>
            </div>

            {/* Tickets */}
            <div>
              <h3 className="font-bold mb-3">Tickets</h3>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-muted">
                    <span>
                      {item.ticketType.name} <span className="text-muted-foreground">× {item.quantity}</span>
                    </span>
                    <span className="font-semibold">${item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 text-lg">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-primary">${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-bold mb-3">Contact Information</h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {order.customerName}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {order.customerEmail}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  {order.customerPhone}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details */}
        {order.status === 'PENDING_VERIFICATION' && bankDetails && (
          <Card>
            <CardHeader>
              <CardTitle>Bank Transfer Details</CardTitle>
              <CardDescription>Transfer the exact amount to the following account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Bank Name', value: bankDetails.bankName },
                { label: 'Account Number', value: bankDetails.accountNumber },
                { label: 'Account Name', value: bankDetails.accountName },
                { label: 'SWIFT Code', value: bankDetails.swiftCode },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center p-3 rounded-lg bg-muted">
                  <span className="text-muted-foreground">{item.label}:</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10">
                <span className="font-semibold">Reference Code:</span>
                <span className="font-bold text-primary">{order.referenceCode}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10">
                <span className="font-semibold">Amount:</span>
                <span className="font-bold text-primary text-lg">${order.totalAmount.toFixed(2)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                ⚠️ Please include the reference code in your bank transfer memo/notes.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Upload Payment Proof */}
        {order.status === 'PENDING_VERIFICATION' && (
          <Card>
            <CardHeader>
              <CardTitle>Upload Payment Proof</CardTitle>
              <CardDescription>
                After making the bank transfer, upload a screenshot or PDF of your payment confirmation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.paymentProof && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/50 text-green-500">
                  <p className="font-medium mb-2">✓ Payment proof uploaded</p>
                  <p className="text-sm mb-3">
                    Uploaded on {new Date(order.paymentProof.uploadedAt).toLocaleString()}
                  </p>
                  <a
                    href={`http://localhost:3001/uploads/${order.paymentProof.fileName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm hover:underline"
                  >
                    View uploaded file <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              <form onSubmit={handleFileUpload} className="space-y-4">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required={!order.paymentProof}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {uploadError && (
                  <p className="text-sm text-destructive">{uploadError}</p>
                )}
                <Button type="submit" disabled={uploading || !file} className="w-full">
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : order.paymentProof ? 'Update Payment Proof' : 'Upload Payment Proof'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Tickets Section */}
        {order.status === 'VERIFIED' && order.tickets && order.tickets.length > 0 && (
          <Card className="border-2 border-green-500/50">
            <CardHeader>
              <CardTitle className="text-green-500">Your Tickets</CardTitle>
              <CardDescription>
                Your tickets have been generated and sent to your email address.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">Total Tickets: {order.tickets.length}</p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
