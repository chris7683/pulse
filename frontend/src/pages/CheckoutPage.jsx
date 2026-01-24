import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '../api/client';
import './CheckoutPage.css';

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { prom, items } = location.state || {};

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  if (!prom || !items) {
    return (
      <div className="container">
        <div className="error">No items selected. Please go back and select tickets.</div>
      </div>
    );
  }

  function handleChange(e) {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload an image (JPEG, PNG) or PDF file');
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('File size must be less than 5MB');
        return;
      }

      setPaymentProof(file);
      setError(null);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPaymentProofPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPaymentProofPreview(null);
      }
    }
  }

  function removeFile() {
    setPaymentProof(null);
    setPaymentProofPreview(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate payment proof is uploaded
    if (!paymentProof) {
      setError('Please upload a photo of your bank transaction');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Create the order
      const { data } = await client.post('/orders', {
        promId: prom.id,
        ...formData,
        items
      });

      // Step 2: Upload payment proof
      const formDataUpload = new FormData();
      formDataUpload.append('file', paymentProof);

      try {
        await client.post(`/upload/payment-proof/${data.order.id}`, formDataUpload, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } catch (uploadErr) {
        console.error('Failed to upload payment proof:', uploadErr);
        // Continue even if upload fails - user can upload later
      }

      // Show success modal
      setShowSuccessModal(true);
      
      // Redirect to homepage after 3 seconds
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  }

  const total = items.reduce((sum, item) => {
    const ticketType = prom.ticketTypes.find(tt => tt.id === item.ticketTypeId);
    return sum + (ticketType ? ticketType.price * item.quantity : 0);
  }, 0);

  return (
    <div className="container">
      <div className="checkout-page">
        <h1>Checkout</h1>

        <div className="checkout-content">
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="form-section">
              <h2>Order Summary</h2>
              <div className="order-items">
                {items.map(item => {
                  const ticketType = prom.ticketTypes.find(tt => tt.id === item.ticketTypeId);
                  if (!ticketType) return null;
                  return (
                    <div key={item.ticketTypeId} className="order-item">
                      <div>
                        <strong>{ticketType.name}</strong>
                        <span className="item-qty">× {item.quantity}</span>
                      </div>
                      <div>${(ticketType.price * item.quantity).toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
              <div className="order-total">
                <span>Total:</span>
                <strong>${total.toFixed(2)}</strong>
              </div>
            </div>

            <div className="form-section">
              <h2>Contact Information</h2>
              <div className="form-group">
                <label htmlFor="customerName">Full Name *</label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  minLength={2}
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label htmlFor="customerEmail">Email *</label>
                <input
                  type="email"
                  id="customerEmail"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="customerPhone">Phone *</label>
                <input
                  type="tel"
                  id="customerPhone"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  required
                  minLength={10}
                  maxLength={20}
                />
              </div>
            </div>

            <div className="form-section">
              <h2>Payment Proof</h2>
              <p className="section-description">
                Please upload a photo or screenshot of your bank transaction showing the payment. 
                Accepted formats: JPEG, PNG, or PDF (max 5MB).
              </p>
              
              {!paymentProof ? (
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="paymentProof"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={handleFileChange}
                    required
                    className="file-input"
                  />
                  <label htmlFor="paymentProof" className="file-upload-label">
                    <div className="upload-icon">📤</div>
                    <div className="upload-text">
                      <strong>Click to upload</strong> or drag and drop
                    </div>
                    <div className="upload-hint">JPEG, PNG, or PDF (max 5MB)</div>
                  </label>
                </div>
              ) : (
                <div className="file-preview">
                  {paymentProofPreview ? (
                    <div className="preview-image">
                      <img src={paymentProofPreview} alt="Payment proof preview" />
                    </div>
                  ) : (
                    <div className="preview-file">
                      <div className="file-icon">📄</div>
                      <div className="file-name">{paymentProof.name}</div>
                    </div>
                  )}
                  <div className="file-info">
                    <span className="file-name-text">{paymentProof.name}</span>
                    <span className="file-size">{(paymentProof.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="remove-file-btn"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
              {loading ? 'Processing...' : 'Create Order'}
            </button>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="success-modal-overlay" onClick={() => navigate('/', { replace: true })}>
          <div className="success-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon">✓</div>
            <h2>Order Placed Successfully!</h2>
            <p>Your order has been placed. Please wait for a confirmation email.</p>
            <p className="success-note">You will be redirected to the home page shortly...</p>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/', { replace: true })}
            >
              Go to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

