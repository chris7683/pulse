import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import './HomePage.css';

export default function HomePage() {
  const [proms, setProms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProms();
  }, []);

  async function loadProms() {
    try {
      setLoading(true);
      const { data } = await client.get('/proms');
      setProms(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="container"><div className="loading">Loading proms...</div></div>;
  if (error) return <div className="container"><div className="error">Error: {error}</div></div>;

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-content">
          <h1>Book Your Perfect Prom Experience</h1>
          <p className="lead">Choose from our selection of amazing proms and secure your tickets today.</p>
        </div>
      </section>

      <section className="proms-section">
        <h2>Available Proms</h2>
        <div className="proms-grid">
          {proms.map(prom => (
            <Link key={prom.id} to={`/prom/${prom.id}`} className="prom-card">
              <div className="prom-card-header">
                <span className="prom-badge">Prom</span>
                <span className="prom-date">{new Date(prom.date).toLocaleDateString()}</span>
              </div>
              <div className="prom-card-body">
                <h3>{prom.name}</h3>
                <p className="prom-venue">{prom.venue} • {prom.city}</p>
                {prom.description && <p className="prom-desc">{prom.description}</p>}
              </div>
              <div className="prom-card-footer">
                <div className="prom-price">
                  <span>from</span>
                  <strong>${Math.min(...prom.ticketTypes.map(tt => tt.price)).toFixed(2)}</strong>
                </div>
                <button className="btn btn-primary">View Details</button>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

