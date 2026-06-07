import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, useUserProfile } from "../hooks";
import { routePaths } from "../routes";
import { createEmptyUserProfile, saveUserProfile } from "../services";
import type { PlacementStatus, UserProfileInput } from "../types";

const placementStatuses: PlacementStatus[] = [
  "Not Started",
  "Preparing",
  "Actively Applying",
  "Placed",
];

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

const panelStyle = {
  padding: "24px",
  borderRadius: "24px",
  background: "rgba(2, 2, 2, 0.98)",
  border: "1px solid rgba(199, 173, 144, 0.12)",
  boxShadow: "0 30px 70px rgba(0, 0, 0, 0.45)",
};

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, error } = useUserProfile(user?.uid);
  const [form, setForm] = useState<UserProfileInput>(createEmptyUserProfile());
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const isCreatingProfile = !loading && !profile;
  const isEditing = editing || isCreatingProfile;

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      navigate(routePaths.login);
      return;
    }

    setSaving(true);
    setPageError("");
    setSuccessMessage("");

    try {
      await saveUserProfile(user.uid, user.email, form);
      setSuccessMessage("Your profile has been updated and saved to Firestore.");
      setEditing(false);
    } catch (nextError) {
      setPageError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to save your profile right now.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleStartEditing() {
    if (profile) {
      setForm({
        name: profile.name,
        university: profile.university,
        degree: profile.degree,
        graduationYear: profile.graduationYear,
        targetRole: profile.targetRole,
        currentCgpa: profile.currentCgpa,
        placementStatus: profile.placementStatus,
      });
    }

    setEditing(true);
    setSuccessMessage("");
    setPageError("");
  }

  const profileItems = [
    { label: "Name", value: profile?.name || "Not added yet" },
    { label: "University", value: profile?.university || "Not added yet" },
    { label: "Degree", value: profile?.degree || "Not added yet" },
    {
      label: "Graduation Year",
      value: profile?.graduationYear || "Not added yet",
    },
    { label: "Target Role", value: profile?.targetRole || "Not added yet" },
    { label: "Current CGPA", value: profile?.currentCgpa || "Not added yet" },
    {
      label: "Placement Status",
      value: profile?.placementStatus || "Not added yet",
    },
    { label: "Email", value: user?.email || "Not available" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px 0 40px",
        color: "var(--off-white)",
      }}
    >
      <div style={{ width: "100%", margin: 0, padding: "0 24px" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "18px",
            marginBottom: "28px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p
              style={{
                margin: "0 0 10px",
                fontSize: "12px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--french-beige-soft)",
              }}
            >
              KeepUP Profile
            </p>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(2rem, 5vw, 42px)",
                lineHeight: 1.04,
                fontWeight: 800,
              }}
            >
              Your saved profile
            </h1>
            <p
              style={{
                margin: "14px 0 0",
                maxWidth: "760px",
                color: "var(--muted-stone)",
                fontSize: "15px",
                lineHeight: 1.7,
              }}
            >
              KeepUP uses this profile to personalize your roadmap, analytics,
              resume analysis, and placement guidance.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link
              to={routePaths.dashboard}
              style={{
                padding: "12px 18px",
                borderRadius: "14px",
                border: "1px solid rgba(199, 173, 144, 0.14)",
                background: "rgba(6, 6, 6, 0.96)",
                color: "var(--off-white)",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              Back to dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                if (isEditing && profile) {
                  setEditing(false);
                  setSuccessMessage("");
                  setPageError("");
                  return;
                }

                handleStartEditing();
              }}
              style={{
                padding: "12px 18px",
                borderRadius: "14px",
                border: "1px solid rgba(199, 173, 144, 0.14)",
                background: "linear-gradient(135deg, #f7f3eb, #c7ad90)",
                color: "#050505",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              {isEditing && profile
                ? "Cancel Update"
                : profile
                  ? "Update Profile"
                  : "Complete Profile"}
            </button>
          </div>
        </header>

        {error || pageError ? (
          <div
            style={{
              marginBottom: "18px",
              padding: "14px 16px",
              borderRadius: "16px",
              background: "rgba(18, 14, 11, 0.98)",
              border: "1px solid rgba(199, 173, 144, 0.16)",
              color: "var(--off-white-soft)",
              lineHeight: 1.6,
            }}
          >
            {pageError || error}
          </div>
        ) : null}

        {successMessage ? (
          <div
            style={{
              marginBottom: "18px",
              padding: "14px 16px",
              borderRadius: "16px",
              background: "rgba(10, 10, 10, 0.96)",
              border: "1px solid rgba(199, 173, 144, 0.16)",
              color: "var(--off-white)",
              lineHeight: 1.6,
            }}
          >
            {successMessage}
          </div>
        ) : null}

        {loading ? (
          <div style={panelStyle}>Loading your profile...</div>
        ) : isEditing ? (
          <form onSubmit={handleSubmit} style={panelStyle}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "18px",
              }}
            >
              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "14px", color: "var(--off-white-soft)" }}>Name</span>
                <input name="name" value={form.name} onChange={handleChange} required style={inputStyle} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "14px", color: "var(--off-white-soft)" }}>University</span>
                <input name="university" value={form.university} onChange={handleChange} required style={inputStyle} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "14px", color: "var(--off-white-soft)" }}>Degree</span>
                <input name="degree" value={form.degree} onChange={handleChange} required style={inputStyle} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "14px", color: "var(--off-white-soft)" }}>Graduation Year</span>
                <input type="number" name="graduationYear" value={form.graduationYear} onChange={handleChange} min="2000" max="2100" required style={inputStyle} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "14px", color: "var(--off-white-soft)" }}>Target Role</span>
                <input name="targetRole" value={form.targetRole} onChange={handleChange} required style={inputStyle} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "14px", color: "var(--off-white-soft)" }}>Current CGPA</span>
                <input type="number" name="currentCgpa" value={form.currentCgpa} onChange={handleChange} min="0" max="10" step="0.01" required style={inputStyle} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "14px", color: "var(--off-white-soft)" }}>Placement Status</span>
                <select name="placementStatus" value={form.placementStatus} onChange={handleChange} required style={inputStyle}>
                  {placementStatuses.map((status) => (
                    <option key={status} value={status} style={{ color: "#050505" }}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

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
              <p style={{ margin: 0, color: "var(--muted-stone)", fontSize: "14px", lineHeight: 1.6 }}>
                Changes are saved to your Firestore user record and reused across the app.
              </p>

              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "14px 22px",
                  border: "none",
                  borderRadius: "14px",
                  background: saving
                    ? "linear-gradient(135deg, #2b2b2b, #141414)"
                    : "linear-gradient(135deg, #f7f3eb, #c7ad90)",
                  color: saving ? "#bdbdbd" : "#050505",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving profile..." : "Save Profile"}
              </button>
            </div>
          </form>
        ) : (
          <section style={panelStyle}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "14px",
              }}
            >
              {profileItems.map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "18px",
                    borderRadius: "18px",
                    background: "rgba(8, 8, 8, 0.96)",
                    border: "1px solid rgba(199, 173, 144, 0.12)",
                  }}
                >
                  <p style={{ margin: "0 0 8px", color: "var(--muted-stone)", fontSize: "12px" }}>
                    {item.label}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      lineHeight: 1.6,
                      wordBreak: "break-word",
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
