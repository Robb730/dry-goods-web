import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/useAuth";

import Login from "./pages/Login";
import Orders from "./pages/Orders";
import NewOrder from "./pages/NewOrder";
import Preparing from "./pages/Preparing";
import PreparingDetail from "./pages/PreparingDetail";
import OutForDelivery from "./pages/OutForDelivery";
import DeliveryDetail from "./pages/DeliveryDetail";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Layout from "./components/Layout";

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
      </div>
    );
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/orders" replace />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/new" element={<NewOrder />} />
          <Route path="preparing" element={<Preparing />} />
          <Route path="preparing/:id" element={<PreparingDetail />} />
          <Route path="delivery" element={<OutForDelivery />} />
          <Route path="delivery/:id" element={<DeliveryDetail />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}