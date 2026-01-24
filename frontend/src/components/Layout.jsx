import { Link, Outlet } from 'react-router-dom';
import './Layout.css';

export default function Layout() {
  return (
    <div className="layout">
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            <div className="brand-mark" aria-hidden="true">P</div>
            <div className="brand-text">
              <div className="brand-name">Pulse</div>
              <div className="brand-tag">Prom Booking</div>
            </div>
          </Link>
          <nav className="nav">
            <Link to="/" className="nav-link">Proms</Link>
            <Link to="/admin/login" className="nav-link">Admin</Link>
          </nav>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container footer-inner">
          <div className="foot-note">© 2024 Pulse Productions. Prom booking system.</div>
        </div>
      </footer>
    </div>
  );
}

