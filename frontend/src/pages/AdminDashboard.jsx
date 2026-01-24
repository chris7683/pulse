import { useEffect, useState } from 'react';
import { Routes, Route, Link, NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';
import client from '../api/client';
import './AdminDashboard.css';

function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  }

  function isActive(path) {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Pulse Admin</h2>
        </div>
        <nav className="sidebar-nav">
          <Link to="/admin/dashboard" className={isActive('/admin/dashboard') ? 'active' : ''}>Dashboard</Link>
          <Link to="/admin/orders" className={isActive('/admin/orders') ? 'active' : ''}>Orders</Link>
          <Link to="/admin/proms" className={isActive('/admin/proms') ? 'active' : ''}>Proms</Link>
          <Link to="/admin/analytics" className={isActive('/admin/analytics') ? 'active' : ''}>Analytics</Link>
        </nav>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}

function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const { data } = await client.get('/admin/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>Failed to load statistics</div>;

  return (
    <div className="dashboard-home">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Orders</h3>
          <div className="stat-value">{stats.orders.total}</div>
        </div>
        <div className="stat-card">
          <h3>Pending Verification</h3>
          <div className="stat-value warning">{stats.orders.pending}</div>
        </div>
        <div className="stat-card">
          <h3>Verified</h3>
          <div className="stat-value success">{stats.orders.verified}</div>
        </div>
        <div className="stat-card">
          <h3>Rejected</h3>
          <div className="stat-value error">{stats.orders.rejected}</div>
        </div>
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <div className="stat-value">${stats.revenue.total.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  async function loadOrders() {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const { data } = await client.get('/admin/orders', { params });
      setOrders(data.orders);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="orders-list">
      <div className="orders-header">
        <h1>Orders</h1>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="PENDING_VERIFICATION">Pending</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
      <div className="orders-table">
        <table>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Customer</th>
              <th>Prom</th>
              <th>Amount</th>
              <th>Payment Proof</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>{order.referenceCode}</td>
                <td>{order.customerName}</td>
                <td>{order.prom.name}</td>
                <td>${order.totalAmount.toFixed(2)}</td>
                <td>
                  {order.paymentProof ? (
                    <span className="proof-badge has-proof" title="Payment proof uploaded">
                      ✓ Uploaded
                    </span>
                  ) : order.status === 'PENDING_VERIFICATION' ? (
                    <span className="proof-badge no-proof" title="No payment proof yet">
                      ⏳ Pending
                    </span>
                  ) : (
                    <span className="proof-badge">—</span>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${order.status.toLowerCase()}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                  <Link to={`/admin/orders/${order.id}`} className="btn-link">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function loadOrder() {
    try {
      const { data } = await client.get(`/admin/orders/${id}`);
      setOrder(data);
    } catch (err) {
      console.error('Failed to load order:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!confirm('Verify this payment and generate tickets?')) return;
    setProcessing(true);
    try {
      await client.post(`/admin/orders/${id}/verify`);
      alert('Order verified! Tickets have been generated and sent to customer.');
      loadOrder();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to verify order');
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    const reason = prompt('Rejection reason (optional):');
    setProcessing(true);
    try {
      await client.post(`/admin/orders/${id}/reject`, { reason });
      alert('Order rejected.');
      loadOrder();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject order');
    } finally {
      setProcessing(false);
    }
  }

  if (loading) return <div>Loading order...</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div className="order-detail">
      <button onClick={() => navigate('/admin/orders')} className="back-btn">← Back to Orders</button>
      <h1>Order {order.referenceCode}</h1>
      
      <div className="order-info">
        <div className="info-section">
          <h3>Status</h3>
          <span className={`status-badge large ${order.status.toLowerCase()}`}>
            {order.status.replace('_', ' ')}
          </span>
        </div>

        <div className="info-section">
          <h3>Customer</h3>
          <p>{order.customerName}</p>
          <p>{order.customerEmail}</p>
          <p>{order.customerPhone}</p>
        </div>

        <div className="info-section">
          <h3>Event</h3>
          <p><strong>{order.prom.name}</strong></p>
          <p>{new Date(order.prom.date).toLocaleDateString()}</p>
          <p>{order.prom.venue}</p>
        </div>

        <div className="info-section">
          <h3>Tickets</h3>
          {order.items.map((item, idx) => (
            <p key={idx}>{item.ticketType.name} × {item.quantity} = ${item.subtotal.toFixed(2)}</p>
          ))}
          <p className="total"><strong>Total: ${order.totalAmount.toFixed(2)}</strong></p>
        </div>

        {order.paymentProof && (
          <div className="info-section payment-proof-section">
            <h3>Payment Proof</h3>
            <div className="proof-meta">
              <p>Uploaded: {new Date(order.paymentProof.uploadedAt).toLocaleString()}</p>
              <p className="proof-file-name">{order.paymentProof.originalFileName || order.paymentProof.fileName}</p>
            </div>
            
            <div className="proof-preview">
              {order.paymentProof.mimeType?.startsWith('image/') ? (
                <div className="proof-image-container">
                  <img 
                    src={`http://localhost:3001/uploads/${order.paymentProof.fileName}`}
                    alt="Payment proof" 
                    className="proof-image"
                    onError={(e) => {
                      console.error('Failed to load image:', e.target.src);
                      e.target.style.display = 'none';
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', order.paymentProof.fileName);
                    }}
                  />
                  <div className="proof-fallback" style={{ display: 'none' }}>
                    <span className="fallback-icon">🖼️</span>
                    <span>Image failed to load</span>
                    <span className="fallback-hint">File: {order.paymentProof.fileName}</span>
                  </div>
                </div>
              ) : (
                <div className="proof-file-preview">
                  <div className="file-preview-icon">📄</div>
                  <div className="file-preview-info">
                    <strong>{order.paymentProof.originalFileName || order.paymentProof.fileName}</strong>
                    <span>PDF Document</span>
                  </div>
                </div>
              )}
              
              <div className="proof-actions">
                <a 
                  href={`http://localhost:3001/uploads/${order.paymentProof.fileName}`}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-primary"
                >
                  Open Full Size
                </a>
                <a 
                  href={`http://localhost:3001/uploads/${order.paymentProof.fileName}`}
                  download={order.paymentProof.originalFileName || order.paymentProof.fileName}
                  className="btn btn-ghost"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        )}
        
        {!order.paymentProof && order.status === 'PENDING_VERIFICATION' && (
          <div className="info-section payment-proof-missing">
            <h3>Payment Proof</h3>
            <p className="missing-notice">⚠️ No payment proof uploaded yet. Waiting for customer to upload.</p>
          </div>
        )}

        {order.status === 'PENDING_VERIFICATION' && (
          <div className="action-buttons">
            <button onClick={handleVerify} className="btn btn-success" disabled={processing}>
              {processing ? 'Processing...' : 'Verify & Generate Tickets'}
            </button>
            <button onClick={handleReject} className="btn btn-danger" disabled={processing}>
              {processing ? 'Processing...' : 'Reject Order'}
            </button>
          </div>
        )}

        {order.status === 'VERIFIED' && order.tickets && (
          <div className="info-section">
            <h3>Tickets Generated</h3>
            <p>{order.tickets.length} tickets have been generated and sent to customer.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PromsList() {
  const [proms, setProms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProm, setEditingProm] = useState(null);

  useEffect(() => {
    loadProms();
  }, []);

  async function loadProms() {
    try {
      const { data } = await client.get('/admin/proms');
      setProms(data);
    } catch (err) {
      console.error('Failed to load proms:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(prom) {
    setEditingProm(prom);
    setShowForm(true);
  }

  function handleDelete(prom) {
    if (!confirm(`Are you sure you want to deactivate "${prom.name}"?`)) return;
    
    client.delete(`/admin/proms/${prom.id}`)
      .then(() => {
        alert('Prom deactivated');
        loadProms();
      })
      .catch(err => {
        alert(err.response?.data?.error || 'Failed to deactivate prom');
      });
  }

  if (loading) return <div>Loading proms...</div>;

  return (
    <div className="proms-list">
      <div className="page-header">
        <h1>Proms Management</h1>
        <button className="btn btn-primary" onClick={() => { setEditingProm(null); setShowForm(true); }}>
          + Add New Prom
        </button>
      </div>

      {showForm && (
        <PromForm
          prom={editingProm}
          onClose={() => { setShowForm(false); setEditingProm(null); }}
          onSuccess={() => { setShowForm(false); setEditingProm(null); loadProms(); }}
        />
      )}

      <div className="proms-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Date</th>
              <th>Venue</th>
              <th>City</th>
              <th>Ticket Types</th>
              <th>Orders</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {proms.map(prom => (
              <tr key={prom.id}>
                <td><strong>{prom.name}</strong></td>
                <td>{new Date(prom.date).toLocaleDateString()}</td>
                <td>{prom.venue}</td>
                <td>{prom.city}</td>
                <td>{prom.ticketTypes.length}</td>
                <td>{prom._count.orders}</td>
                <td>
                  <span className={`status-badge ${prom.isActive ? 'active' : 'inactive'}`}>
                    {prom.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button className="btn-link" onClick={() => handleEdit(prom)}>Edit</button>
                  {prom.isActive && (
                    <button className="btn-link danger" onClick={() => handleDelete(prom)}>Deactivate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PromForm({ prom, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: prom?.name || '',
    date: prom ? new Date(prom.date).toISOString().slice(0, 16) : '',
    venue: prom?.venue || '',
    city: prom?.city || '',
    description: prom?.description || '',
    isActive: prom?.isActive !== undefined ? prom.isActive : true,
    ticketTypes: prom?.ticketTypes || [
      { name: 'Standing', price: '', description: '' },
      { name: 'VIP', price: '', description: '' },
      { name: 'Lounge', price: '', description: '' }
    ]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }

  function handleTicketTypeChange(index, field, value) {
    setFormData(prev => ({
      ...prev,
      ticketTypes: prev.ticketTypes.map((tt, i) => 
        i === index ? { ...tt, [field]: value } : tt
      )
    }));
  }

  function addTicketType() {
    setFormData(prev => ({
      ...prev,
      ticketTypes: [...prev.ticketTypes, { name: '', price: '', description: '' }]
    }));
  }

  function removeTicketType(index) {
    setFormData(prev => ({
      ...prev,
      ticketTypes: prev.ticketTypes.filter((_, i) => i !== index)
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (prom) {
        await client.put(`/admin/proms/${prom.id}`, formData);
      } else {
        await client.post('/admin/proms', formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to save prom');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{prom ? 'Edit Prom' : 'Add New Prom'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="prom-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-row">
            <div className="form-group">
              <label>Prom Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input
                type="datetime-local"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Venue *</label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            />
          </div>

          {prom && (
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                Active
              </label>
            </div>
          )}

          <div className="ticket-types-section">
            <div className="section-header">
              <h3>Ticket Types *</h3>
              {!prom && <button type="button" className="btn btn-ghost" onClick={addTicketType}>+ Add Type</button>}
            </div>
            {formData.ticketTypes.map((tt, index) => (
              <div key={index} className="ticket-type-row">
                <input
                  type="text"
                  placeholder="Name (e.g., Standing)"
                  value={tt.name}
                  onChange={(e) => handleTicketTypeChange(index, 'name', e.target.value)}
                  required
                />
                <input
                  type="number"
                  placeholder="Price"
                  step="0.01"
                  min="0"
                  value={tt.price}
                  onChange={(e) => handleTicketTypeChange(index, 'price', e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={tt.description}
                  onChange={(e) => handleTicketTypeChange(index, 'description', e.target.value)}
                />
                {!prom && formData.ticketTypes.length > 1 && (
                  <button type="button" className="btn-danger" onClick={() => removeTicketType(index)}>Remove</button>
                )}
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : prom ? 'Update Prom' : 'Create Prom'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Analytics() {
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSalesData();
  }, []);

  async function loadSalesData() {
    try {
      const { data } = await client.get('/admin/stats/sales');
      setSalesData(data);
    } catch (err) {
      console.error('Failed to load sales data:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="analytics">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }
  
  if (!salesData) {
    return (
      <div className="analytics">
        <div className="error-state">
          <p>Failed to load analytics</p>
        </div>
      </div>
    );
  }

  const totalTickets = salesData.byProm.reduce((sum, p) => sum + p.totalTickets, 0);
  const totalRevenue = salesData.byProm.reduce((sum, p) => sum + p.totalRevenue, 0);

  return (
    <div className="analytics">
      <div className="analytics-header">
        <div>
          <h1>Sales Analytics</h1>
          <p className="analytics-subtitle">Comprehensive sales breakdown by prom and ticket type</p>
        </div>
        <div className="analytics-summary">
          <div className="summary-card">
            <div className="summary-label">Total Tickets</div>
            <div className="summary-value">{totalTickets}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Total Revenue</div>
            <div className="summary-value revenue">${totalRevenue.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="analytics-section">
        <div className="section-header-analytics">
          <h2>Sales by Prom</h2>
          <span className="section-count">{salesData.byProm.length} {salesData.byProm.length === 1 ? 'Prom' : 'Proms'}</span>
        </div>
        <div className="sales-grid">
          {salesData.byProm.map(prom => (
            <div key={prom.promId} className="sales-card">
              <div className="sales-card-header">
                <h3>{prom.promName}</h3>
                <div className="sales-badge">{prom.totalTickets} {prom.totalTickets === 1 ? 'ticket' : 'tickets'}</div>
              </div>
              <div className="sales-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Tickets</span>
                  <span className="stat-value">{prom.totalTickets}</span>
                </div>
                <div className="stat-item highlight">
                  <span className="stat-label">Total Revenue</span>
                  <span className="stat-value revenue">${prom.totalRevenue.toFixed(2)}</span>
                </div>
              </div>
              <div className="ticket-breakdown">
                <h4>By Ticket Type</h4>
                <div className="breakdown-list">
                  {Object.values(prom.ticketTypes).map((tt, idx) => (
                    <div key={idx} className="breakdown-item">
                      <div className="breakdown-left">
                        <span className="breakdown-name">{tt.name}</span>
                        <span className="breakdown-quantity">{tt.quantity} {tt.quantity === 1 ? 'ticket' : 'tickets'}</span>
                      </div>
                      <span className="breakdown-revenue">${tt.revenue.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {salesData.byProm.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p className="no-data">No sales data available yet.</p>
              <p className="no-data-sub">Sales will appear here once orders are verified.</p>
            </div>
          )}
        </div>
      </div>

      <div className="analytics-section">
        <div className="section-header-analytics">
          <h2>Sales by Ticket Type</h2>
          <span className="section-count">All Proms</span>
        </div>
        <div className="sales-table">
          <table>
            <thead>
              <tr>
                <th>Ticket Type</th>
                <th>Quantity Sold</th>
                <th>Total Revenue</th>
                <th>Average Price</th>
              </tr>
            </thead>
            <tbody>
              {salesData.byTicketType.map((tt, idx) => {
                const avgPrice = tt.quantity > 0 ? (tt.revenue / tt.quantity).toFixed(2) : '0.00';
                return (
                  <tr key={idx}>
                    <td>
                      <div className="ticket-type-cell">
                        <span className="ticket-type-name">{tt.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="table-value">{tt.quantity}</span>
                    </td>
                    <td>
                      <span className="table-value revenue">${tt.revenue.toFixed(2)}</span>
                    </td>
                    <td>
                      <span className="table-value muted">${avgPrice}</span>
                    </td>
                  </tr>
                );
              })}
              {salesData.byTicketType.length === 0 && (
                <tr>
                  <td colSpan="4" className="no-data">
                    <div className="empty-state-inline">
                      <span>📊</span>
                      <span>No sales data available yet.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Routes>
      <Route path="/*" element={
        <DashboardLayout>
          <Routes>
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="orders" element={<OrdersList />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="proms" element={<PromsList />} />
            <Route path="analytics" element={<Analytics />} />
          </Routes>
        </DashboardLayout>
      } />
    </Routes>
  );
}

