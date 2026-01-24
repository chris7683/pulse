import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import client from '../api/client';
import './OrderStatusPage.css';

export default function OrderStatusPage() {
  const { referenceCode } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [bankDetails, setBankDetails] = useState(location.state?.bankDetails || null);
  const [loading, setLoading] = useState(!order);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (!order) {
      loadOrder();
    }
  }, [referenceCode]);

  async function loadOrder() {
    try {
      setLoading(true);
      const { data } = await client.get(`/orders/${referenceCode}`);
      setOrder(data);
    } catch (err) {
      console.error('Failed to load order:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await client.post(`/upload/payment-proof/${order.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Payment proof uploaded successfully!');
      setFile(null);
      loadOrder(); // Reload order to see updated status
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'VERIFIED': return 'var(--good)';
      case 'REJECTED': return 'var(--bad)';
      case 'PENDING_VERIFICATION': return 'var(--warn)';
      default: return 'var(--muted)';
    }
  }

  if (loading) return <div className="container"><div className="loading">Loading order...</div></div>;
  if (!order) return <div className="container"><div className="error">Order not found</div></div>;

  return (
    <div className="container">
      <div className="order-status-page">
        <h1>Order Status</h1>
        
        <div className="order-card">
          <div className="order-header">
            <div>
              <h2>Order #{order.referenceCode}</h2>
              <p className="order-date">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <div className={`status-badge ${order.status.toLowerCase()}`} style={{ backgroundColor: getStatusColor(order.status) + '20', borderColor: getStatusColor(order.status) }}>
              {order.status.replace('_', ' ')}
            </div>
          </div>

          <div className="order-details">
            <div className="detail-section">
              <h3>Event</h3>
              <p><strong>{order.prom.name}</strong></p>
              <p>{new Date(order.prom.date).toLocaleDateString()} • {order.prom.venue}</p>
            </div>

            <div className="detail-section">
              <h3>Tickets</h3>
              {order.items.map((item, idx) => (
                <div key={idx} className="ticket-item">
                  <span>{item.ticketType.name} × {item.quantity}</span>
                  <span>${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
              <div className="ticket-total">
                <span>Total:</span>
                <strong>${order.totalAmount.toFixed(2)}</strong>
              </div>
            </div>

            <div className="detail-section">
              <h3>Contact</h3>
              <p>{order.customerName}</p>
              <p>{order.customerEmail}</p>
              <p>{order.customerPhone}</p>
            </div>
          </div>
        </div>

        {order.status === 'PENDING_VERIFICATION' && (
          <>
            {bankDetails && (
              <div className="bank-details-card">
                <h2>Bank Transfer Details</h2>
                <div className="bank-info">
                  <div className="bank-row">
                    <span>Bank Name:</span>
                    <strong>{bankDetails.bankName}</strong>
                  </div>
                  <div className="bank-row">
                    <span>Account Number:</span>
                    <strong>{bankDetails.accountNumber}</strong>
                  </div>
                  <div className="bank-row">
                    <span>Account Name:</span>
                    <strong>{bankDetails.accountName}</strong>
                  </div>
                  <div className="bank-row">
                    <span>SWIFT Code:</span>
                    <strong>{bankDetails.swiftCode}</strong>
                  </div>
                  <div className="bank-row highlight">
                    <span>Reference Code:</span>
                    <strong>{order.referenceCode}</strong>
                  </div>
                  <div className="bank-row highlight">
                    <span>Amount:</span>
                    <strong>${order.totalAmount.toFixed(2)}</strong>
                  </div>
                </div>
                <p className="bank-note">Please include the reference code in your bank transfer memo/notes.</p>
              </div>
            )}

            <div className="upload-section">
              <h2>Upload Payment Proof</h2>
              <p className="upload-note">After making the bank transfer, please upload a screenshot or PDF of your payment confirmation.</p>
              
              {order.paymentProof && (
                <div className="proof-uploaded">
                  <p>✓ Payment proof uploaded on {new Date(order.paymentProof.uploadedAt).toLocaleString()}</p>
            <a href={`http://localhost:3001/uploads/${order.paymentProof.fileName}`} target="_blank" rel="noopener noreferrer">
              View uploaded file
            </a>
                </div>
              )}

              <form onSubmit={handleFileUpload} className="upload-form">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                  required={!order.paymentProof}
                />
                {uploadError && <div className="error-message">{uploadError}</div>}
                <button type="submit" className="btn btn-primary" disabled={uploading || !file}>
                  {uploading ? 'Uploading...' : order.paymentProof ? 'Update Payment Proof' : 'Upload Payment Proof'}
                </button>
              </form>
            </div>
          </>
        )}

        {order.status === 'VERIFIED' && order.tickets && order.tickets.length > 0 && (
          <div className="tickets-section">
            <h2>Your Tickets</h2>
            <p>Your tickets have been generated and sent to your email address.</p>
            <p><strong>Total Tickets:</strong> {order.tickets.length}</p>
          </div>
        )}
      </div>
    </div>
  );
}

