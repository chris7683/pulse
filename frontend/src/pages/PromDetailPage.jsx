import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import './PromDetailPage.css';

export default function PromDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prom, setProm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProm();
  }, [id]);

  async function loadProm() {
    try {
      setLoading(true);
      const { data } = await client.get(`/proms/${id}`);
      setProm(data);
      // Initialize selected tickets
      const initial = {};
      data.ticketTypes.forEach(tt => {
        initial[tt.id] = 0;
      });
      setSelectedTickets(initial);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateQuantity(ticketTypeId, delta) {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketTypeId]: Math.max(0, Math.min(10, (prev[ticketTypeId] || 0) + delta))
    }));
  }

  function getTotal() {
    if (!prom) return 0;
    return prom.ticketTypes.reduce((sum, tt) => {
      const qty = selectedTickets[tt.id] || 0;
      return sum + (tt.price * qty);
    }, 0);
  }

  function getTotalQuantity() {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  }

  function handleCheckout() {
    const items = prom.ticketTypes
      .filter(tt => selectedTickets[tt.id] > 0)
      .map(tt => ({
        ticketTypeId: tt.id,
        quantity: selectedTickets[tt.id]
      }));

    if (items.length === 0) {
      alert('Please select at least one ticket');
      return;
    }

    navigate('/checkout', {
      state: {
        prom,
        items
      }
    });
  }

  if (loading) return <div className="container"><div className="loading">Loading...</div></div>;
  if (error) return <div className="container"><div className="error">Error: {error}</div></div>;
  if (!prom) return <div className="container"><div className="error">Prom not found</div></div>;

  return (
    <div className="container">
      <div className="prom-detail">
        <div className="prom-header">
          <h1>{prom.name}</h1>
          <div className="prom-meta">
            <span>{new Date(prom.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span>•</span>
            <span>{prom.venue}</span>
            <span>•</span>
            <span>{prom.city}</span>
          </div>
          {prom.description && <p className="prom-description">{prom.description}</p>}
        </div>

        <div className="ticket-selection">
          <h2>Select Tickets</h2>
          <div className="ticket-types">
            {prom.ticketTypes.map(tt => (
              <div key={tt.id} className="ticket-type-card">
                <div className="ticket-type-header">
                  <h3>{tt.name}</h3>
                  <div className="ticket-price">${tt.price.toFixed(2)}</div>
                </div>
                {tt.description && <p className="ticket-desc">{tt.description}</p>}
                <div className="ticket-quantity">
                  <button 
                    className="qty-btn" 
                    onClick={() => updateQuantity(tt.id, -1)}
                    disabled={!selectedTickets[tt.id]}
                  >−</button>
                  <span className="qty-value">{selectedTickets[tt.id] || 0}</span>
                  <button 
                    className="qty-btn" 
                    onClick={() => updateQuantity(tt.id, 1)}
                    disabled={selectedTickets[tt.id] >= 10}
                  >+</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="checkout-summary">
          <div className="summary-row">
            <span>Total Tickets:</span>
            <strong>{getTotalQuantity()}</strong>
          </div>
          <div className="summary-row total">
            <span>Total Amount:</span>
            <strong>${getTotal().toFixed(2)}</strong>
          </div>
          <button 
            className="btn btn-primary btn-large" 
            onClick={handleCheckout}
            disabled={getTotalQuantity() === 0}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

