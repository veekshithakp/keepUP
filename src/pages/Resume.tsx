import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Timeline, type TimelineItem } from "@/components/ui";
import { useAuth, useResumeAnalysis } from "../hooks";
import { routePaths } from "../routes";
import { analyzeResume, tailorResumeToJobDescription } from "../services";

const cardStyle = {
  padding: "18px",
  borderRadius: "18px",
  background: "rgba(8, 8, 8, 0.96)",
  border: "1px solid rgba(199, 173, 144, 0.12)",
} as const;

function getResumeTimelineItems(
  analysis: NonNullable<ReturnType<typeof useResumeAnalysis>["analysis"]>,
): TimelineItem[] {
  return [
    {
      title: "Projects",
      category: "Portfolio",
      description:
        "Gemini extracted the strongest project signals from your resume. This is the clearest evidence of practical work recruiters will notice first.",
      bullets: analysis.projects,
      status: analysis.projects.length >= 3 ? "completed" : "current",
    },
    {
      title: "Skills",
      category: "Technical Fit",
      description:
        "These are the technologies and core capabilities that stood out in the resume for role matching and ATS scanning.",
      bullets: analysis.skills,
      status: analysis.skills.length >= 4 ? "completed" : "current",
    },
    {
      title: "Missing Sections",
      category: "Gaps",
      description:
        "These sections are weak or missing, and they are likely reducing clarity, ATS performance, or recruiter confidence.",
      bullets: analysis.missingSections,
      status: analysis.missingSections.length === 0 ? "completed" : "current",
    },
    {
      title: "Strengths",
      category: "What Works",
      description:
        "These parts are already helping your resume stand out and should be preserved while you improve the weaker sections.",
      bullets: analysis.strengths,
      status: "completed",
    },
    {
      title: "Recommendations",
      category: "Next Actions",
      description:
        "These are the highest-value improvements Gemini recommends to increase resume quality, ATS compatibility, and placement readiness.",
      bullets: analysis.recommendations,
      status: "upcoming",
    },
  ];
}

export default function Resume() {
  const { user } = useAuth();
  const { analysis, loading, error } = useResumeAnalysis(user?.uid);
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [targetJobTitle, setTargetJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tailoring, setTailoring] = useState(false);
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const timelineItems = analysis ? getResumeTimelineItems(analysis) : [];

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setSuccessMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !file) {
      return;
    }

    setSubmitting(true);
    setPageError("");
    setSuccessMessage("");

    try {
      await analyzeResume(user.uid, file, targetRole);
      setSuccessMessage(
        "Resume analyzed successfully. Your ATS score and recommendations were saved to Firestore.",
      );
    } catch (nextError) {
      setPageError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to analyze your resume right now.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTailorResume(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    setTailoring(true);
    setPageError("");
    setSuccessMessage("");

    try {
      await tailorResumeToJobDescription(user.uid, jobDescription, targetJobTitle);
      setSuccessMessage(
        "Tailored resume guidance generated and saved. Review the rewritten summary, project bullets, and keywords below.",
      );
    } catch (nextError) {
      setPageError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to tailor your resume to this job description right now.",
      );
    } finally {
      setTailoring(false);
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
              KeepUP Resume Analyzer
            </p>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(2rem, 5vw, 42px)",
                lineHeight: 1.04,
                fontWeight: 800,
              }}
            >
              Analyze your resume
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
              Upload a resume in PDF, DOCX, JPG, JPEG, PNG, WEBP, TXT, MD,
              HTML, XML, or RTF format and let Gemini evaluate projects,
              skills, missing sections, ATS readiness, and practical
              improvement steps.
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
            <Link
              to={routePaths.coach}
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
              Open AI Coach
            </Link>
          </div>
        </header>

        {(error || pageError) && (
          <div
            style={{
              marginBottom: "18px",
              padding: "14px 16px",
              borderRadius: "16px",
              background: "rgba(24, 8, 8, 0.96)",
              border: "1px solid rgba(199, 173, 144, 0.16)",
              color: "var(--off-white-soft)",
              lineHeight: 1.6,
            }}
          >
            {pageError || error}
          </div>
        )}

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

        <section
          style={{
            padding: "24px",
            borderRadius: "24px",
            background: "rgba(2, 2, 2, 0.98)",
            border: "1px solid rgba(199, 173, 144, 0.12)",
            boxShadow: "0 30px 70px rgba(0, 0, 0, 0.45)",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
              alignItems: "flex-start",
              flexWrap: "wrap",
              marginBottom: "18px",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "24px" }}>Upload resume file</h2>
              <p style={{ margin: "8px 0 0", color: "var(--muted-stone)", lineHeight: 1.7 }}>
                We analyze supported resume files with Gemini and save the
                results to Firestore.
              </p>
            </div>
            <span
              style={{
                padding: "10px 14px",
                borderRadius: "999px",
                background: "rgba(20, 20, 20, 0.98)",
                color: "var(--off-white)",
                border: "1px solid rgba(199, 173, 144, 0.12)",
                fontWeight: 700,
              }}
            >
              {loading ? "Loading saved analysis..." : analysis ? "Analysis saved" : "No analysis yet"}
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "14px",
                marginBottom: "18px",
              }}
            >
              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ color: "var(--off-white-soft)" }}>Resume file</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.jpg,.jpeg,.png,.webp,.txt,.md,.markdown,.html,.htm,.xml,.rtf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp,text/plain,text/markdown,text/html,text/xml,application/rtf"
                  onChange={handleFileChange}
                  required
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: "1px solid rgba(199, 173, 144, 0.12)",
                    background: "rgba(8, 8, 8, 0.98)",
                    color: "var(--off-white)",
                    fontSize: "15px",
                    boxSizing: "border-box",
                  }}
                />
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--muted-stone-strong)",
                    lineHeight: 1.5,
                  }}
                >
                  Supported: PDF, DOCX, JPG, JPEG, PNG, WEBP, TXT, MD, HTML,
                  XML, and RTF. Max size 10 MB.
                </span>
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ color: "var(--off-white-soft)" }}>Target role</span>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(event) => setTargetRole(event.target.value)}
                  placeholder="Optional override for role-specific ATS feedback"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: "1px solid rgba(199, 173, 144, 0.12)",
                    background: "rgba(8, 8, 8, 0.98)",
                    color: "var(--off-white)",
                    fontSize: "15px",
                    boxSizing: "border-box",
                  }}
                />
              </label>
            </div>

            {file ? (
              <p style={{ margin: "0 0 16px", color: "var(--muted-stone)", lineHeight: 1.7 }}>
                Selected file: {file.name}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting || !file}
              style={{
                padding: "14px 18px",
                border: "none",
                borderRadius: "14px",
                background:
                  submitting || !file
                    ? "linear-gradient(135deg, #2b2b2b, #141414)"
                    : "linear-gradient(135deg, #f7f3eb, #c7ad90)",
                color: submitting || !file ? "#bdbdbd" : "#050505",
                fontWeight: 700,
                cursor: submitting || !file ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Analyzing Resume..." : "Analyze Resume"}
            </button>
          </form>
        </section>

        {analysis ? (
          <div style={{ display: "grid", gap: "18px" }}>
            <section
              style={{
                padding: "24px",
                borderRadius: "24px",
                background: "rgba(2, 2, 2, 0.98)",
                border: "1px solid rgba(199, 173, 144, 0.12)",
                boxShadow: "0 30px 70px rgba(0, 0, 0, 0.45)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "16px",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  marginBottom: "18px",
                }}
              >
                <div>
                  <h2 style={{ margin: 0, fontSize: "24px" }}>
                    Tailor resume to job description
                  </h2>
                  <p
                    style={{
                      margin: "8px 0 0",
                      color: "var(--muted-stone)",
                      lineHeight: 1.7,
                    }}
                  >
                    Paste a job description and KeepUP will generate a targeted
                    professional summary, emphasize the right skills, and rewrite
                    project bullets for that role.
                  </p>
                </div>
                <span
                  style={{
                    padding: "10px 14px",
                    borderRadius: "999px",
                    background: "rgba(20, 20, 20, 0.98)",
                    color: "var(--off-white)",
                    border: "1px solid rgba(199, 173, 144, 0.12)",
                    fontWeight: 700,
                  }}
                >
                  {analysis.tailoredResume ? "Tailored version saved" : "No tailored version yet"}
                </span>
              </div>

              <form onSubmit={handleTailorResume}>
                <div
                  style={{
                    display: "grid",
                    gap: "14px",
                    marginBottom: "18px",
                  }}
                >
                  <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ color: "var(--off-white-soft)" }}>Target job title</span>
                    <input
                      type="text"
                      value={targetJobTitle}
                      onChange={(event) => setTargetJobTitle(event.target.value)}
                      placeholder="Software Engineer Intern, AI Engineer, Data Analyst..."
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderRadius: "14px",
                        border: "1px solid rgba(199, 173, 144, 0.12)",
                        background: "rgba(8, 8, 8, 0.98)",
                        color: "var(--off-white)",
                        fontSize: "15px",
                        boxSizing: "border-box",
                      }}
                    />
                  </label>

                  <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ color: "var(--off-white-soft)" }}>Job description</span>
                    <textarea
                      value={jobDescription}
                      onChange={(event) => setJobDescription(event.target.value)}
                      placeholder="Paste the full job description here so KeepUP can tailor the resume to the role..."
                      rows={8}
                      style={{
                        width: "100%",
                        padding: "14px 16px",
                        borderRadius: "14px",
                        border: "1px solid rgba(199, 173, 144, 0.12)",
                        background: "rgba(8, 8, 8, 0.98)",
                        color: "var(--off-white)",
                        fontSize: "15px",
                        boxSizing: "border-box",
                        resize: "vertical",
                      }}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={tailoring || !jobDescription.trim()}
                  style={{
                    padding: "14px 18px",
                    border: "none",
                    borderRadius: "14px",
                    background:
                      tailoring || !jobDescription.trim()
                        ? "linear-gradient(135deg, #2b2b2b, #141414)"
                        : "linear-gradient(135deg, #f7f3eb, #c7ad90)",
                    color: tailoring || !jobDescription.trim() ? "#bdbdbd" : "#050505",
                    fontWeight: 700,
                    cursor: tailoring || !jobDescription.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {tailoring ? "Tailoring Resume..." : "Tailor Resume"}
                </button>
              </form>

              {analysis.tailoredResume ? (
                <div style={{ display: "grid", gap: "16px", marginTop: "24px" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "14px",
                    }}
                  >
                    <div style={cardStyle}>
                      <p style={{ margin: "0 0 8px", color: "var(--muted-stone)", fontSize: "12px" }}>
                        Target job title
                      </p>
                      <p style={{ margin: 0, fontWeight: 700, lineHeight: 1.6 }}>
                        {analysis.tailoredResume.targetJobTitle || "Not specified"}
                      </p>
                    </div>
                    <div style={cardStyle}>
                      <p style={{ margin: "0 0 8px", color: "var(--muted-stone)", fontSize: "12px" }}>
                        Match summary
                      </p>
                      <p style={{ margin: 0, lineHeight: 1.6 }}>
                        {analysis.tailoredResume.matchSummary}
                      </p>
                    </div>
                  </div>

                  <div style={cardStyle}>
                    <p
                      style={{
                        margin: "0 0 10px",
                        color: "var(--muted-stone)",
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      Tailored professional summary
                    </p>
                    <p style={{ margin: 0, color: "var(--off-white-soft)", lineHeight: 1.7 }}>
                      {analysis.tailoredResume.tailoredProfessionalSummary}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                      gap: "14px",
                    }}
                  >
                    <div style={cardStyle}>
                      <p
                        style={{
                          margin: "0 0 10px",
                          color: "var(--muted-stone)",
                          fontSize: "12px",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        Skills to emphasize
                      </p>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {analysis.tailoredResume.tailoredSkills.map((skill) => (
                          <div
                            key={skill}
                            style={{
                              padding: "10px 12px",
                              borderRadius: "12px",
                              background: "rgba(14, 14, 14, 0.98)",
                              color: "var(--off-white-soft)",
                              lineHeight: 1.6,
                            }}
                          >
                            {skill}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={cardStyle}>
                      <p
                        style={{
                          margin: "0 0 10px",
                          color: "var(--muted-stone)",
                          fontSize: "12px",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        Missing keywords
                      </p>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {analysis.tailoredResume.missingKeywords.map((keyword) => (
                          <div
                            key={keyword}
                            style={{
                              padding: "10px 12px",
                              borderRadius: "12px",
                              background: "rgba(14, 14, 14, 0.98)",
                              color: "var(--off-white-soft)",
                              lineHeight: 1.6,
                            }}
                          >
                            {keyword}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={cardStyle}>
                    <p
                      style={{
                        margin: "0 0 10px",
                        color: "var(--muted-stone)",
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      Rewritten project bullets
                    </p>
                    <div style={{ display: "grid", gap: "8px" }}>
                      {analysis.tailoredResume.rewrittenProjectBullets.map((bullet) => (
                        <div
                          key={bullet}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "12px",
                            background: "rgba(14, 14, 14, 0.98)",
                            color: "var(--off-white-soft)",
                            lineHeight: 1.7,
                          }}
                        >
                          {bullet}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={cardStyle}>
                    <p
                      style={{
                        margin: "0 0 10px",
                        color: "var(--muted-stone)",
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      Tailoring recommendations
                    </p>
                    <div style={{ display: "grid", gap: "8px" }}>
                      {analysis.tailoredResume.recommendations.map((item) => (
                        <div
                          key={item}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "12px",
                            background: "rgba(14, 14, 14, 0.98)",
                            color: "var(--off-white-soft)",
                            lineHeight: 1.7,
                          }}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            <section
              style={{
                padding: "24px",
                borderRadius: "24px",
                background: "rgba(2, 2, 2, 0.98)",
                border: "1px solid rgba(199, 173, 144, 0.12)",
                boxShadow: "0 30px 70px rgba(0, 0, 0, 0.45)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "14px",
                  marginBottom: "18px",
                }}
              >
                <div style={cardStyle}>
                  <p style={{ margin: "0 0 8px", color: "var(--muted-stone)", fontSize: "12px" }}>
                    Resume file
                  </p>
                  <p style={{ margin: 0, fontWeight: 700, lineHeight: 1.6 }}>
                    {analysis.fileName}
                  </p>
                </div>
                <div style={cardStyle}>
                  <p style={{ margin: "0 0 8px", color: "var(--muted-stone)", fontSize: "12px" }}>
                    ATS score
                  </p>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: "28px", color: "var(--off-white)" }}>
                    {analysis.atsScore}/100
                  </p>
                </div>
                <div style={cardStyle}>
                  <p style={{ margin: "0 0 8px", color: "var(--muted-stone)", fontSize: "12px" }}>
                    Target role
                  </p>
                  <p style={{ margin: 0, fontWeight: 700, lineHeight: 1.6 }}>
                    {analysis.targetRole || "Not specified"}
                  </p>
                </div>
              </div>

              <div style={{ ...cardStyle, marginBottom: "18px" }}>
                <p
                  style={{
                    margin: "0 0 10px",
                    color: "var(--muted-stone)",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Summary
                </p>
                <p style={{ margin: 0, color: "var(--off-white-soft)", lineHeight: 1.7 }}>
                  {analysis.summary}
                </p>
              </div>

              <Timeline items={timelineItems} className="py-1" />
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
