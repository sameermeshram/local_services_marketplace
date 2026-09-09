import { Routes, Route, Navigate } from "react-router-dom";
import LoginRegisterPage from "./pages/LoginRegisterPage";
import CustomerDashboardPage from "./pages/CustomerDashboardPage";
import ProviderDashboardPage from "./pages/ProviderDashboardPage";
import ProviderProfilePage from "./pages/ProviderProfilePage";
import EditProviderProfilePage from "./pages/EditProviderProfilePage";
import MyBookingsPage from "./pages/MyBookingsPage";
import ProtectedRoute from "./components/navigation/ProtectedRoute";

const protectedPage = (element, requiredRole) => (
  <ProtectedRoute requiredRole={requiredRole}>{element}</ProtectedRoute>
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRegisterPage />} />
      <Route path="/" element={protectedPage(<CustomerDashboardPage />)} />
      <Route path="/bookings" element={protectedPage(<MyBookingsPage />)} />
      <Route
        path="/providers/:id"
        element={protectedPage(<ProviderProfilePage />)}
      />
      <Route
        path="/profile/edit"
        element={protectedPage(<EditProviderProfilePage />, "provider")}
      />
      <Route
        path="/provider/dashboard"
        element={protectedPage(<ProviderDashboardPage />, "provider")}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
