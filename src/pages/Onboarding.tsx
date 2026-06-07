import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUserProfile } from "../hooks";
import { routePaths } from "../routes";
import { createEmptyUserProfile, saveUserProfile } from "../services";
import type { PlacementStatus, UserProfileInput } from "../types";

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid rgba(199, 173, 144, 0.12)",
  background: "rgba(16, 16, 16, 0.98)",
  color: "var(--off-white)",
  fontSize: "15px",
  outline: "none",
  boxSizing: "border-box" as const,
};

const placementStatuses: PlacementStatus[] = [
  "Not Started",
  "Preparing",
  "Actively Applying",
  "Placed",
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.uid);
  const [form, setForm] = useState<UserProfileInput>(createEmptyUserProfile());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const welcomeName = user?.email ? user.email.split("@")[0] : "there";

  useEffect(() => {
    if (!profileLoading && profile) {
      navigate(routePaths.profile, { replace: true });
    }
  }, [navigate, profile, profileLoading]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      navigate(routePaths.login);
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await saveUserProfile(user.uid, user.email, form);
      navigate(routePaths.dashboard);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your profile right now. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (profileLoading || profile) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted-stone)",
          padding: "24px",
          textAlign: "center",
        }}
      >
        Loading your profile...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "36px 24px 48px",
        color: "var(--off-white)",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <div
          style={{
            marginBottom: "28px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 10px",
              fontSize: "12px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--french-beige-soft)",
            }}
          >
            KeepUP Onboarding
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(2rem, 5vw, 40px)",
              lineHeight: 1.08,
              fontWeight: 800,
            }}
          >
            Let&apos;s set up your profile
          </h1>
          <p
            style={{
              margin: "14px auto 0",
              maxWidth: "680px",
              color: "var(--muted-stone)",
              fontSize: "16px",
              lineHeight: 1.7,
            }}
          >
            Welcome, {welcomeName}. Tell us a bit about your academic journey so
            KeepUP can personalize your roadmap and placement planning.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            padding: "32px",
            borderRadius: "28px",
            background: "rgba(8, 8, 8, 0.98)",
            border: "1px solid rgba(199, 173, 144, 0.12)",
            boxShadow: "0 30px 80px rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(18px)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "18px",
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: "var(--off-white-soft)" }}>Name</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
                style={inputStyle}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: "var(--off-white-soft)" }}>
                University
              </span>
              <input
                name="university"
                value={form.university}
                onChange={handleChange}
                placeholder="Your university or college"
                required
                style={inputStyle}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: "var(--off-white-soft)" }}>Degree</span>
              <input
                name="degree"
                value={form.degree}
                onChange={handleChange}
                placeholder="B.Tech, B.Sc, MBA..."
                required
                style={inputStyle}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: "var(--off-white-soft)" }}>
                Graduation Year
              </span>
              <input
                type="number"
                name="graduationYear"
                value={form.graduationYear}
                onChange={handleChange}
                placeholder="2027"
                min="2000"
                max="2100"
                required
                style={inputStyle}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: "var(--off-white-soft)" }}>
                Target Role
              </span>
              <input
                name="targetRole"
                value={form.targetRole}
                onChange={handleChange}
                placeholder="Software Engineer"
                required
                style={inputStyle}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: "var(--off-white-soft)" }}>
                Current CGPA
              </span>
              <input
                type="number"
                name="currentCgpa"
                value={form.currentCgpa}
                onChange={handleChange}
                placeholder="8.4"
                min="0"
                max="10"
                step="0.01"
                required
                style={inputStyle}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "14px", color: "var(--off-white-soft)" }}>
                Placement Status
              </span>
              <select
                name="placementStatus"
                value={form.placementStatus}
                onChange={handleChange}
                required
                style={inputStyle}
              >
                {placementStatuses.map((status) => (
                  <option
                    key={status}
                    value={status}
                    style={{ color: "#020617" }}
                  >
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <div
              style={{
                marginTop: "20px",
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

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "16px",
              marginTop: "28px",
              flexWrap: "wrap",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "var(--muted-stone)",
                fontSize: "14px",
                lineHeight: 1.6,
              }}
            >
              Your profile will be saved to Firestore under your user record.
            </p>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "14px 22px",
                border: "none",
                borderRadius: "14px",
                background: submitting
                  ? "linear-gradient(135deg, #3d352c, #221c16)"
                  : "linear-gradient(135deg, #f7f3eb, #c7ad90)",
                color: "#050505",
                fontSize: "15px",
                fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: submitting ? "none" : "0 20px 40px rgba(0, 0, 0, 0.3)",
              }}
            >
              {submitting ? "Saving profile..." : "Continue to Dashboard"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
