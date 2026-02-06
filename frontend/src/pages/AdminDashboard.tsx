import { useEffect, useState, ReactNode } from 'react'
import { Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, BarChart3, LogOut, Eye, CheckCircle, XCircle } from 'lucide-react'
import client from '../api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import PulseMark from '../images/P PULSE BLACK-05.png'

function DashboardLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    localStorage.removeItem('adminToken')
    navigate('/admin/login')
  }

  function isActive(path: string) {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/orders', label: 'Orders', icon: Package },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 border-r border-border bg-card">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
              <img src={PulseMark} alt="Pulse" className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <div className="font-black text-lg">Pulse Admin</div>
              <div className="text-xs text-muted-foreground">Management</div>
            </div>
          </div>
          <nav className="space-y-2">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive(item.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}

function DashboardHome() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const { data } = await client.get('/admin/stats')
      setStats(data)
    } catch (err) {
      console.error('Failed to load stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!stats) return <div>Failed to load statistics</div>

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-black">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.orders.total}</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle>Pending Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-yellow-500">{stats.orders.pending}</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/50">
          <CardHeader>
            <CardTitle>Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-500">{stats.orders.verified}</div>
          </CardContent>
        </Card>
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle>Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-destructive">{stats.orders.rejected}</div>
          </CardContent>
        </Card>
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">${stats.revenue.total.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function OrdersList() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  async function loadOrders() {
    try {
      const params = statusFilter ? { status: statusFilter } : {}
      const { data } = await client.get('/admin/orders', { params })
      setOrders(data.orders)
    } catch (err) {
      console.error('Failed to load orders:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading orders...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black">Orders</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border bg-background"
        >
          <option value="">All Status</option>
          <option value="PENDING_VERIFICATION">Pending</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-left">
                <th className="p-4 font-semibold">Reference</th>
                <th className="p-4 font-semibold">Customer</th>
                <th className="p-4 font-semibold">Prom</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-accent/50">
                  <td className="p-4 font-mono text-sm">{order.referenceCode}</td>
                  <td className="p-4">{order.customerName}</td>
                  <td className="p-4">{order.prom.name}</td>
                  <td className="p-4 font-semibold">${order.totalAmount.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold',
                      order.status === 'VERIFIED' && 'bg-green-500/10 text-green-500',
                      order.status === 'PENDING_VERIFICATION' && 'bg-yellow-500/10 text-yellow-500',
                      order.status === 'REJECTED' && 'bg-destructive/10 text-destructive'
                    )}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <Link to={`/admin/orders/${order.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadOrder()
  }, [id])

  async function loadOrder() {
    try {
      const { data } = await client.get(`/admin/orders/${id}`)
      setOrder(data)
    } catch (err) {
      console.error('Failed to load order:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    if (!confirm('Verify this payment and generate tickets?')) return
    setProcessing(true)
    try {
      await client.post(`/admin/orders/${id}/verify`)
      alert('Order verified! Tickets have been generated and sent to customer.')
      loadOrder()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to verify order')
    } finally {
      setProcessing(false)
    }
  }

  async function handleReject() {
    const reason = prompt('Rejection reason (optional):')
    setProcessing(true)
    try {
      await client.post(`/admin/orders/${id}/reject`, { reason })
      alert('Order rejected.')
      loadOrder()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject order')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div>Loading order...</div>
  if (!order) return <div>Order not found</div>

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate('/admin/orders')}>
        ← Back to Orders
      </Button>
      <h1 className="text-4xl font-black">Order {order.referenceCode}</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <span className={cn(
              'inline-block px-4 py-2 rounded-lg text-sm font-semibold',
              order.status === 'VERIFIED' && 'bg-green-500/10 text-green-500',
              order.status === 'PENDING_VERIFICATION' && 'bg-yellow-500/10 text-yellow-500',
              order.status === 'REJECTED' && 'bg-destructive/10 text-destructive'
            )}>
              {order.status.replace('_', ' ')}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-semibold">{order.customerName}</p>
            <p className="text-muted-foreground">{order.customerEmail}</p>
            <p className="text-muted-foreground">{order.customerPhone}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-bold">{order.prom.name}</p>
            <p className="text-muted-foreground">{new Date(order.prom.date).toLocaleDateString()}</p>
            <p className="text-muted-foreground">{order.prom.venue}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between">
                <span>{item.ticketType.name} × {item.quantity}</span>
                <span className="font-semibold">${item.subtotal.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 border-t text-lg">
              <span className="font-bold">Total:</span>
              <span className="font-bold text-primary">${order.totalAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {order.paymentProof && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Proof</CardTitle>
            <CardDescription>
              Uploaded: {new Date(order.paymentProof.uploadedAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.paymentProof.mimeType?.startsWith('image/') ? (
              <img 
                src={`http://localhost:3001/uploads/${order.paymentProof.fileName}`}
                alt="Payment proof"
                className="w-full max-w-2xl rounded-lg border"
              />
            ) : (
              <div className="p-8 text-center border rounded-lg">
                <p>PDF Document</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a 
                  href={`http://localhost:3001/uploads/${order.paymentProof.fileName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Full Size
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {order.status === 'PENDING_VERIFICATION' && (
        <div className="flex gap-4">
          <Button onClick={handleVerify} disabled={processing}>
            <CheckCircle className="w-4 h-4" />
            {processing ? 'Processing...' : 'Verify & Generate Tickets'}
          </Button>
          <Button variant="destructive" onClick={handleReject} disabled={processing}>
            <XCircle className="w-4 h-4" />
            {processing ? 'Processing...' : 'Reject Order'}
          </Button>
        </div>
      )}
    </div>
  )
}

function Analytics() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-black">Analytics</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Analytics coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/orders" element={<OrdersList />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/" element={<DashboardHome />} />
      </Routes>
    </DashboardLayout>
  )
}
