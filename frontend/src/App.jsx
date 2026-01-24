import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import PromDetailPage from './pages/PromDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderStatusPage from './pages/OrderStatusPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="prom/:id" element={<PromDetailPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="order/:referenceCode" element={<OrderStatusPage />} />
      </Route>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;

