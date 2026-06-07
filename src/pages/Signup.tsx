import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks";
import { routePaths } from "../routes";
import { getAuthErrorMessage } from "../services";

export default function Signup() {
  const navigate = useNavigate();
  const { signup, user, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && !submitting) {
      navigate(routePaths.dashboard);
    }
  }, [loading, navigate, submitting, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await signup(email, password);
      navigate(routePaths.onboarding);
    } catch (err) {
      setError(getAuthErrorMessage(err, "signup"));
    } finally {
      setSubmitting(false);
    }
  }

  const isDisabled = loading || submitting;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        color: "var(--off-white)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "40px 32px",
          borderRadius: "24px",
          background: "rgba(8, 8, 8, 0.98)",
          border: "1px solid rgba(199, 173, 144, 0.12)",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.45)",
          backdropFilter: "blur(18px)",
        }}
      >
        <div style={{ marginBottom: "28px" }}>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: "12px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--french-beige-soft)",
            }}
          >
            KeepUP
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "32px",
              lineHeight: 1.1,
              fontWeight: 700,
            }}
          >
            Create your account
          </h1>
          <p
            style={{
              margin: "12px 0 0",
              color: "var(--muted-stone)",
              fontSize: "15px",
              lineHeight: 1.6,
            }}
          >
            Start building your roadmap, track progress, and keep your goals in
            motion.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "18px" }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "14px", color: "var(--off-white-soft)" }}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "14px",
                border: "1px solid rgba(199, 173, 144, 0.12)",
                background: "rgba(16, 16, 16, 0.98)",
                color: "var(--off-white)",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "14px", color: "var(--off-white-soft)" }}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a password"
              autoComplete="new-password"
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "14px",
                border: "1px solid rgba(199, 173, 144, 0.12)",
                background: "rgba(16, 16, 16, 0.98)",
                color: "var(--off-white)",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </label>

          {error ? (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "14px",
                background: "rgba(18, 14, 11, 0.98)",
                border: "1px solid rgba(199, 173, 144, 0.16)",
                color: "var(--off-white-soft)",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isDisabled}
            style={{
              marginTop: "6px",
              padding: "14px 18px",
              border: "none",
              borderRadius: "14px",
              background: isDisabled
                ? "linear-gradient(135deg, #3d352c, #221c16)"
                : "linear-gradient(135deg, #f7f3eb, #c7ad90)",
              color: "#050505",
              fontSize: "15px",
              fontWeight: 700,
              cursor: isDisabled ? "not-allowed" : "pointer",
              boxShadow: isDisabled
                ? "none"
                : "0 20px 40px rgba(0, 0, 0, 0.3)",
              transition: "transform 160ms ease, box-shadow 160ms ease",
            }}
          >
            {loading
              ? "Checking session..."
              : submitting
                ? "Creating account..."
                : "Create Account"}
          </button>
        </form>

        <p
          style={{
            margin: "20px 0 0",
            textAlign: "center",
            color: "var(--muted-stone)",
            fontSize: "14px",
          }}
        >
          Already have an account?{" "}
          <Link
            to={routePaths.login}
            style={{
              color: "var(--french-beige-soft)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
