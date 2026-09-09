import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authService } from "../../services/authService";

export default function ProtectedRoute({ children, requiredRole }) {
  const location = useLocation();
  const [state, setState] = useState({ loading: true, user: null });

  useEffect(() => {
    let active = true;

    authService
      .me()
      .then((response) => {
        if (active)
          setState({ loading: false, user: response.data?.user ?? null });
      })
      .catch(() => {
        if (active) setState({ loading: false, user: null });
      });

    return () => {
      active = false;
    };
  }, []);

  if (state.loading) {
    return <div className="min-h-screen bg-surface" aria-busy="true" />;
  }

  if (!state.user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiredRole && state.user.role !== requiredRole) {
    return (
      <Navigate
        to={state.user.role === "provider" ? "/provider/dashboard" : "/"}
        replace
      />
    );
  }

  return children;
}
