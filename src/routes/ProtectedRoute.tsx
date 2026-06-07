import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks";
import { routePaths } from "./paths";

export function ProtectedRoute() {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        background:
          "radial-gradient(circle at top, #1a1a1a 0%, #0d0d0d 45%, #000000 100%)",
          color: "var(--off-white)",
          fontSize: "16px",
          letterSpacing: "0.02em",
        }}
      >
        Checking your session...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={routePaths.login}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}
