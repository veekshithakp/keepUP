import type { ChangeEvent } from "react";
import { applicationStatuses, type ApplicationStatus, type JobApplication } from "../../types";

interface ApplicationColumnProps {
  status: ApplicationStatus;
  applications: JobApplication[];
  onStatusChange: (
    applicationId: string,
    status: ApplicationStatus,
  ) => void | Promise<void>;
}

export function ApplicationColumn({
  status,
  applications,
  onStatusChange,
}: ApplicationColumnProps) {
  return (
    <section
      style={{
        padding: "18px",
        borderRadius: "22px",
        background: "rgba(4, 4, 4, 0.98)",
        border: "1px solid rgba(199, 173, 144, 0.12)",
        boxShadow: "0 24px 48px rgba(0, 0, 0, 0.4)",
        minHeight: "320px",
        minWidth: "320px",
        flex: "0 0 320px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", color: "var(--off-white)" }}>{status}</h2>
          <p style={{ margin: "6px 0 0", color: "var(--muted-stone)", fontSize: "13px" }}>
            {applications.length} application{applications.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gap: "12px" }}>
        {applications.length === 0 ? (
          <div
            style={{
              padding: "16px",
              borderRadius: "16px",
              border: "1px dashed rgba(199, 173, 144, 0.16)",
              color: "#7a7a7a",
              lineHeight: 1.6,
            }}
          >
            No applications in this stage yet.
          </div>
        ) : (
          applications.map((application) => (
            <article
              key={application.id}
              style={{
                padding: "16px",
                borderRadius: "18px",
                background: "rgba(10, 10, 10, 0.98)",
                border: "1px solid rgba(199, 173, 144, 0.12)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "10px",
                  alignItems: "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "17px",
                      lineHeight: 1.3,
                      color: "var(--off-white)",
                    }}
                  >
                    {application.company}
                  </h3>
                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "var(--off-white-soft)",
                      fontSize: "14px",
                    }}
                  >
                    {application.role}
                  </p>
                </div>
                <span
                  style={{
                    padding: "6px 10px",
                    borderRadius: "999px",
                    background: "rgba(28, 28, 28, 0.98)",
                    color: "var(--off-white)",
                    border: "1px solid rgba(199, 173, 144, 0.08)",
                    fontSize: "12px",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  {application.location}
                </span>
              </div>

              <p style={{ margin: "0 0 12px", color: "var(--muted-stone)", fontSize: "13px" }}>
                Applied on {new Date(application.dateApplied).toLocaleDateString()}
              </p>

              {application.applicationUrl ? (
                <a
                  href={application.applicationUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    marginBottom: "12px",
                    color: "var(--french-beige-soft)",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  Open application link
                </a>
              ) : null}

              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ color: "var(--off-white-soft)", fontSize: "13px" }}>Move to stage</span>
                <select
                  value={application.status}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    onStatusChange(
                      application.id,
                      event.target.value as ApplicationStatus,
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid rgba(199, 173, 144, 0.12)",
                    background: "rgba(18, 18, 18, 0.98)",
                    color: "var(--off-white)",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  {applicationStatuses.map((nextStatus) => (
                    <option key={nextStatus} value={nextStatus}>
                      {nextStatus}
                    </option>
                  ))}
                </select>
              </label>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
