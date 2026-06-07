import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { routePaths } from "./paths";
import { ProtectedRoute } from "./ProtectedRoute";

const Applications = lazy(() => import("../pages/Applications"));
const Coach = lazy(() => import("../pages/Coach"));
const CoachChat = lazy(() => import("../pages/CoachChat"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Login = lazy(() => import("../pages/Login"));
const Onboarding = lazy(() => import("../pages/Onboarding"));
const Profile = lazy(() => import("../pages/Profile"));
const Roadmap = lazy(() => import("../pages/Roadmap"));
const Resume = lazy(() => import("../pages/Resume"));
const Signup = lazy(() => import("../pages/Signup"));

function RouteLoadingFallback() {
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
      }}
    >
      Loading KeepUP...
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route
          path={routePaths.home}
          element={<Navigate to={routePaths.login} replace />}
        />
        <Route path={routePaths.login} element={<Login />} />
        <Route path={routePaths.signup} element={<Signup />} />
        <Route element={<ProtectedRoute />}>
          <Route path={routePaths.onboarding} element={<Onboarding />} />
          <Route path={routePaths.profile} element={<Profile />} />
          <Route path={routePaths.dashboard} element={<Dashboard />} />
          <Route path={routePaths.roadmap} element={<Roadmap />} />
          <Route path={routePaths.applications} element={<Applications />} />
          <Route path={routePaths.coach} element={<Coach />} />
          <Route path={routePaths.coachChat} element={<CoachChat />} />
          <Route path={routePaths.resume} element={<Resume />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
