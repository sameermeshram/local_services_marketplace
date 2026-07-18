import { Routes, Route, Navigate } from "react-router-dom";
import LoginRegisterPage from "./pages/LoginRegisterPage";
import CustomerDashboardPage from "./pages/CustomerDashboardPage";
import ProviderDashboardPage from "./pages/ProviderDashboardPage";
import ProviderProfilePage from "./pages/ProviderProfilePage";
import EditProviderProfilePage from "./pages/EditProviderProfilePage";
import MyBookingsPage from "./pages/MyBookingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRegisterPage />} />
      <Route path="/" element={<CustomerDashboardPage />} />
      <Route path="/bookings" element={<MyBookingsPage />} />
      <Route path="/providers/:id" element={<ProviderProfilePage />} />
      <Route path="/profile/edit" element={<EditProviderProfilePage />} />
      <Route path="/provider/dashboard" element={<ProviderDashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
