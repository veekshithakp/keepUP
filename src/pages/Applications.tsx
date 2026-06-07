import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Clock3,
} from "lucide-react";
import { TrackerOverviewCard } from "@/components/ui";
import {
  ApplicationAnalytics,
  ApplicationColumn,
} from "../components/applications";
import { useApplications, useAuth } from "../hooks";
import { routePaths } from "../routes";
import {
  analyzeJobApplicationLink,
  createJobApplication,
  notifyApplicationCreated,
  notifyApplicationStatusChanged,
  updateJobApplicationStatus,
} from "../services";
import { applicationStatuses, type ApplicationStatus } from "../types";

function getTodayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

function clampHeight(value: number, fallback = 28) {
  if (value <= 0) {
    return fallback;
  }

  return Math.min(Math.max(value, 18), 100);
}

export default function Applications() {
  const { user } = useAuth();
  const { groupedApplications, applications, analytics, loading, error } =
    useApplications(user?.uid);

  const [form, setForm] = useState({
    applicationUrl: "",
    company: "",
    role: "",
    location: "",
    dateApplied: getTodayDateValue(),
    status: "Applied" as ApplicationStatus,
  });
  const [submitting, setSubmitting] = useState(false);
  const [analyzingLink, setAnalyzingLink] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [pageError, setPageError] = useState("");

  const applicationOverviewGraph = analytics.weeklyTrend.flatMap((day) => [
    {
      label: `${day.label} applications`,
      duration: Math.max(day.applications, 1),
      height: clampHeight(day.applications * 14),
      tone: "primary" as const,
    },
    {
      label: `${day.label} interviews`,
      duration: Math.max(day.interviews, 1),
      height: clampHeight(day.interviews * 18, 22),
      tone: "secondary" as const,
    },
    {
      label: `${day.label} offers`,
      duration: Math.max(day.offers, 1),
      height: clampHeight(day.offers * 24, 18),
      tone: "tertiary" as const,
    },
  ]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    setPageError("");
    setAnalysisMessage("");
    setSubmitting(true);

    try {
      await createJobApplication(user.uid, {
        applicationUrl: form.applicationUrl,
        company: form.company,
        role: form.role,
        location: form.location,
        dateApplied: new Date(form.dateApplied).toISOString(),
        status: form.status,
      });
      await notifyApplicationCreated({
        company: form.company,
        role: form.role,
      }).catch(() => undefined);

      setForm({
        applicationUrl: "",
        company: "",
        role: "",
        location: "",
        dateApplied: getTodayDateValue(),
        status: "Applied",
      });
    } catch (nextError) {
      setPageError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to save the application right now.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAnalyzeLink() {
    if (!form.applicationUrl.trim()) {
      setPageError("Paste an application link first so KeepUP can analyze it.");
      return;
    }

    setPageError("");
    setAnalysisMessage("");
    setAnalyzingLink(true);

    try {
      const result = await analyzeJobApplicationLink(form.applicationUrl);

      setForm((current) => ({
        ...current,
        applicationUrl: result.applicationUrl,
        company: result.company,
        role: result.role,
        location: result.location === "Unknown Location" ? current.location : result.location,
        status: current.status || "Applied",
      }));
      setAnalysisMessage(
        result.analysisSource === "gemini"
          ? "Link analyzed and fields were auto-filled. You can edit anything before saving."
          : "Link parsed with best-effort URL analysis. Review the fields before saving.",
      );
    } catch (nextError) {
      setPageError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to analyze that application link right now.",
      );
    } finally {
      setAnalyzingLink(false);
    }
  }

  async function handleStatusChange(
    applicationId: string,
    status: ApplicationStatus,
  ) {
    if (!user) {
      return;
    }

    setPageError("");

    try {
      const application = applications.find((item) => item.id === applicationId);
      await updateJobApplicationStatus(user.uid, applicationId, status);
      if (application) {
        await notifyApplicationStatusChanged({
          company: application.company,
          role: application.role,
          status,
        }).catch(() => undefined);
      }
    } catch (nextError) {
      setPageError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to update the application status right now.",
      );
    }
  }

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
              KeepUP Job Tracker
            </p>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(2rem, 5vw, 42px)",
                lineHeight: 1.04,
                fontWeight: 800,
              }}
            >
              Track applications in a kanban board
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
              Save every application to Firestore with company, role, location,
              date applied, and hiring stage. Move cards across stages as your
              placement pipeline evolves.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <a
              href="#add-application"
              style={{
                padding: "12px 18px",
                borderRadius: "14px",
                border: "1px solid rgba(199, 173, 144, 0.14)",
                background: "linear-gradient(135deg, #f7f3eb, #c7ad90)",
                color: "#050505",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              Add application
            </a>
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
            <Link
              to={routePaths.roadmap}
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
              Open roadmap
            </Link>
          </div>
        </header>

        {(error || pageError) && (
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
        )}

        <section style={{ marginBottom: "18px" }}>
          <TrackerOverviewCard
            title="Application Tracker"
            metrics={[
              {
                label: "Applications",
                value: `${analytics.applicationsCount}`,
                detail: "Total records",
              },
              {
                label: "Interviews",
                value: `${analytics.interviewCount}`,
                detail: "Interview and HR rounds",
              },
              {
                label: "Offers",
                value: `${analytics.offerCount}`,
                detail: `${analytics.successRate}% success rate`,
              },
            ]}
            graphData={applicationOverviewGraph}
            startLabel="Last 7 days"
            endLabel={`${applications.length} total`}
            legend={[
              {
                label: "Applied",
                value: `${groupedApplications.Applied.length}`,
                tone: "primary",
              },
              {
                label: "OA / Interview",
                value: `${groupedApplications.OA.length + analytics.interviewCount}`,
                tone: "secondary",
              },
              {
                label: "Offers",
                value: `${analytics.offerCount}`,
                tone: "tertiary",
              },
              {
                label: "Rejected",
                value: `${analytics.rejectionRate}%`,
                tone: "quaternary",
              },
            ]}
            icons={{
              leading: <BriefcaseBusiness className="h-4 w-4" />,
              start: <Clock3 className="h-3.5 w-3.5" />,
              end: <ArrowUpRight className="h-3.5 w-3.5" />,
            }}
          />
        </section>

        <section
          id="add-application"
          style={{
            padding: "24px",
            borderRadius: "24px",
            background: "rgba(8, 8, 8, 0.98)",
            border: "1px solid rgba(199, 173, 144, 0.12)",
            boxShadow: "0 28px 60px rgba(0, 0, 0, 0.45)",
            marginBottom: "18px",
          }}
        >
          <h2 style={{ margin: "0 0 10px", fontSize: "28px" }}>
            Add Application
          </h2>
          <p style={{ margin: "0 0 18px", color: "var(--muted-stone)", lineHeight: 1.7 }}>
            Paste an application link to auto-fill the basics, or enter the details
            manually. The total number of applications is calculated automatically
            from the records you save, and the status you choose here becomes the
            pipeline stage.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              gap: "12px",
              marginBottom: "18px",
              alignItems: "end",
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ color: "var(--off-white-soft)" }}>Application link</span>
              <input
                value={form.applicationUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    applicationUrl: event.target.value,
                  }))
                }
                placeholder="https://jobs.company.com/..."
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: "1px solid rgba(199, 173, 144, 0.12)",
                  background: "rgba(16, 16, 16, 0.98)",
                  color: "var(--off-white)",
                  fontSize: "15px",
                  boxSizing: "border-box",
                }}
              />
            </label>

            <button
              type="button"
              onClick={() => void handleAnalyzeLink()}
              disabled={analyzingLink}
              style={{
                padding: "14px 18px",
                border: "none",
                borderRadius: "14px",
                background: analyzingLink
                  ? "linear-gradient(135deg, #3d352c, #221c16)"
                  : "linear-gradient(135deg, #f7f3eb, #c7ad90)",
                color: "#050505",
                fontWeight: 700,
                cursor: analyzingLink ? "not-allowed" : "pointer",
                minWidth: "170px",
              }}
            >
              {analyzingLink ? "Analyzing..." : "Analyze link"}
            </button>
          </div>

          {analysisMessage ? (
            <div
              style={{
                marginBottom: "18px",
                padding: "14px 16px",
                borderRadius: "16px",
                background: "rgba(199, 173, 144, 0.12)",
                border: "1px solid rgba(199, 173, 144, 0.16)",
                color: "var(--off-white-soft)",
                lineHeight: 1.7,
              }}
            >
              {analysisMessage}
            </div>
          ) : null}

          {applications.length === 0 ? (
            <div
              style={{
                marginBottom: "18px",
                padding: "14px 16px",
                borderRadius: "16px",
                background: "rgba(12, 12, 12, 0.98)",
                border: "1px solid rgba(199, 173, 144, 0.12)",
                color: "var(--off-white-soft)",
                lineHeight: 1.7,
              }}
            >
              No applications have been added yet. Start by entering your first
              company, role, and current status below. KeepUP will then update the
              counts, charts, and kanban board automatically.
            </div>
          ) : null}

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "14px",
              }}
            >
              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ color: "var(--off-white-soft)" }}>Company</span>
                <input
                  value={form.company}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, company: event.target.value }))
                  }
                  placeholder="Google"
                  required
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: "1px solid rgba(199, 173, 144, 0.12)",
                    background: "rgba(16, 16, 16, 0.98)",
                    color: "var(--off-white)",
                    fontSize: "15px",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ color: "var(--off-white-soft)" }}>Role</span>
                <input
                  value={form.role}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, role: event.target.value }))
                  }
                  placeholder="Software Engineer"
                  required
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: "1px solid rgba(199, 173, 144, 0.12)",
                    background: "rgba(16, 16, 16, 0.98)",
                    color: "var(--off-white)",
                    fontSize: "15px",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ color: "var(--off-white-soft)" }}>Location</span>
                <input
                  value={form.location}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, location: event.target.value }))
                  }
                  placeholder="Bengaluru"
                  required
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: "1px solid rgba(199, 173, 144, 0.12)",
                    background: "rgba(16, 16, 16, 0.98)",
                    color: "var(--off-white)",
                    fontSize: "15px",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ color: "var(--off-white-soft)" }}>Date Applied</span>
                <input
                  type="date"
                  value={form.dateApplied}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      dateApplied: event.target.value,
                    }))
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: "1px solid rgba(199, 173, 144, 0.12)",
                    background: "rgba(16, 16, 16, 0.98)",
                    color: "var(--off-white)",
                    fontSize: "15px",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ color: "var(--off-white-soft)" }}>Status</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as ApplicationStatus,
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: "1px solid rgba(199, 173, 144, 0.12)",
                    background: "rgba(16, 16, 16, 0.98)",
                    color: "var(--off-white)",
                    fontSize: "15px",
                    boxSizing: "border-box",
                  }}
                >
                  {applicationStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: "18px",
                padding: "14px 18px",
                border: "none",
                borderRadius: "14px",
                background: submitting
                  ? "linear-gradient(135deg, #3d352c, #221c16)"
                  : "linear-gradient(135deg, #f7f3eb, #c7ad90)",
                color: "#050505",
                fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Saving..." : "Save Application"}
            </button>
          </form>
        </section>

        <ApplicationAnalytics analytics={analytics} />

        <section style={{ marginBottom: "18px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
              alignItems: "center",
              marginBottom: "18px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "28px" }}>Kanban Board</h2>
              <p style={{ margin: "8px 0 0", color: "var(--muted-stone)", lineHeight: 1.7 }}>
                Each column reflects a live Firestore status. Change the dropdown
                on a card to move it across the hiring pipeline.
              </p>
            </div>
            <span
              style={{
                padding: "10px 14px",
                borderRadius: "999px",
                background: "rgba(199, 173, 144, 0.14)",
                color: "var(--off-white)",
                fontWeight: 700,
              }}
            >
              {loading
                ? "Loading applications..."
                : `${applications.length} tracked application${
                    applications.length === 1 ? "" : "s"
                  }`}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: "16px",
              overflowX: "auto",
              paddingBottom: "8px",
              scrollbarWidth: "thin",
            }}
          >
            {applicationStatuses.map((status) => (
              <ApplicationColumn
                key={status}
                status={status}
                applications={groupedApplications[status]}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
