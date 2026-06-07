import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth, useStudyPlanner } from "../hooks";
import { routePaths } from "../routes";
import { generateStudyPlan } from "../services";

export default function Coach() {
  const { user } = useAuth();
  const {
    plan,
    loading: planLoading,
    error: planError,
  } = useStudyPlanner(user?.uid);
  const [availableHoursPerDay, setAvailableHoursPerDay] = useState("3");
  const [targetRole, setTargetRole] = useState("");
  const [deadline, setDeadline] = useState("");
  const [plannerError, setPlannerError] = useState("");
  const [plannerSubmitting, setPlannerSubmitting] = useState(false);

  async function handleStudyPlanSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    setPlannerError("");
    setPlannerSubmitting(true);

    try {
      await generateStudyPlan(user.uid, {
        availableHoursPerDay: Number(availableHoursPerDay),
        targetRole,
        deadline,
      });
    } catch (nextError) {
      setPlannerError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to generate your study plan right now.",
      );
    } finally {
      setPlannerSubmitting(false);
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
              KeepUP AI Coach
            </p>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(2rem, 5vw, 42px)",
                lineHeight: 1.04,
                fontWeight: 800,
              }}
            >
              Build your study plan
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
              Generate a personalized daily study schedule, weekly plan, and
              monthly milestones using your KeepUP progress data and Gemini.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              alignItems: "stretch",
              minWidth: "220px",
            }}
          >
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
                textAlign: "center",
              }}
            >
              Back to dashboard
            </Link>
            <Link
              to={routePaths.coachChat}
              style={{
                padding: "12px 18px",
                borderRadius: "14px",
                border: "1px solid rgba(199, 173, 144, 0.16)",
                background: "linear-gradient(135deg, #f7f3eb, #c7ad90)",
                color: "#050505",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "14px",
                textAlign: "center",
              }}
            >
              Open chatbot
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
                textAlign: "center",
              }}
            >
              Open roadmap
            </Link>
          </div>
        </header>

        {(plannerError || planError) && (
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
            {plannerError || planError}
          </div>
        )}

        <section
          style={{
            padding: "24px",
            borderRadius: "24px",
            background: "rgba(8, 8, 8, 0.98)",
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
              <h2 style={{ margin: 0, fontSize: "24px" }}>Study Planner AI</h2>
              <p style={{ margin: "8px 0 0", color: "var(--muted-stone)", lineHeight: 1.7 }}>
                Create a role-aware plan and keep it saved in Firestore so you
                can revisit and refine it anytime.
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
              {planLoading ? "Loading saved plan..." : plan ? "Saved in Firestore" : "No plan yet"}
            </span>
          </div>

          <form onSubmit={handleStudyPlanSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "14px",
                marginBottom: "18px",
              }}
            >
              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ color: "var(--off-white-soft)" }}>Available hours per day</span>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={
                    availableHoursPerDay ||
                    (plan?.availableHoursPerDay
                      ? String(plan.availableHoursPerDay)
                      : "3")
                  }
                  onChange={(event) => setAvailableHoursPerDay(event.target.value)}
                  placeholder="3"
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
                <span style={{ color: "var(--off-white-soft)" }}>Target role</span>
                <input
                  type="text"
                  value={targetRole || plan?.targetRole || ""}
                  onChange={(event) => setTargetRole(event.target.value)}
                  placeholder="SDE, AI Engineer, Data Scientist..."
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
                <span style={{ color: "var(--off-white-soft)" }}>Deadline</span>
                <input
                  type="date"
                  value={deadline || plan?.deadline || ""}
                  onChange={(event) => setDeadline(event.target.value)}
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
            </div>

            <button
              type="submit"
              disabled={plannerSubmitting}
              style={{
                padding: "14px 18px",
                border: "none",
                borderRadius: "14px",
                background: plannerSubmitting
                  ? "linear-gradient(135deg, #3d352c, #221c16)"
                  : "linear-gradient(135deg, #f7f3eb, #c7ad90)",
                color: "#050505",
                fontWeight: 700,
                cursor: plannerSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {plannerSubmitting ? "Generating Study Plan..." : "Generate Study Plan"}
            </button>
          </form>

          {plan ? (
            <div style={{ display: "grid", gap: "18px", marginTop: "24px" }}>
              <div
                style={{
                  padding: "18px",
                  borderRadius: "18px",
                  background: "rgba(12, 12, 12, 0.98)",
                  border: "1px solid rgba(199, 173, 144, 0.12)",
                }}
              >
                <p
                  style={{
                    margin: "0 0 8px",
                    color: "var(--muted-stone)",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Planner overview
                </p>
                <p style={{ margin: 0, color: "var(--off-white-soft)", lineHeight: 1.7 }}>
                  {plan.overview}
                </p>
              </div>

              <div>
                <h3 style={{ margin: "0 0 12px", fontSize: "20px" }}>
                  Daily study schedule
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {plan.dailySchedule.map((dayPlan) => (
                    <div
                      key={dayPlan.day}
                      style={{
                        padding: "18px",
                        borderRadius: "18px",
                        background: "rgba(12, 12, 12, 0.98)",
                        border: "1px solid rgba(199, 173, 144, 0.12)",
                      }}
                    >
                      <p style={{ margin: "0 0 8px", fontWeight: 800 }}>{dayPlan.day}</p>
                      <p style={{ margin: "0 0 8px", color: "var(--off-white)" }}>
                        {dayPlan.focus}
                      </p>
                      <p style={{ margin: "0 0 12px", color: "var(--muted-stone)" }}>
                        {dayPlan.hours} hrs planned
                      </p>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {dayPlan.tasks.map((task) => (
                          <div
                            key={task}
                            style={{
                              padding: "10px 12px",
                              borderRadius: "12px",
                              background: "rgba(24, 24, 24, 0.98)",
                              color: "var(--off-white-soft)",
                              lineHeight: 1.6,
                            }}
                          >
                            {task}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{ margin: "0 0 12px", fontSize: "20px" }}>Weekly plan</h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  {plan.weeklyPlan.map((week) => (
                    <div
                      key={week.weekLabel}
                      style={{
                        padding: "18px",
                        borderRadius: "18px",
                        background: "rgba(12, 12, 12, 0.98)",
                        border: "1px solid rgba(199, 173, 144, 0.12)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          flexWrap: "wrap",
                          marginBottom: "10px",
                        }}
                      >
                        <p style={{ margin: 0, fontWeight: 800 }}>{week.weekLabel}</p>
                        <span style={{ color: "var(--off-white)", fontWeight: 700 }}>
                          {week.totalHours} hrs
                        </span>
                      </div>
                      <p style={{ margin: "0 0 10px", color: "var(--off-white-soft)", lineHeight: 1.7 }}>
                        {week.objective}
                      </p>
                      <p style={{ margin: "0 0 8px", color: "var(--muted-stone)" }}>
                        Focus: {week.focusAreas.join(", ")}
                      </p>
                      <p style={{ margin: 0, color: "var(--off-white-soft)", lineHeight: 1.7 }}>
                        Deliverables: {week.deliverables.join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{ margin: "0 0 12px", fontSize: "20px" }}>
                  Monthly milestones
                </h3>
                <div style={{ display: "grid", gap: "12px" }}>
                  {plan.monthlyMilestones.map((milestone) => (
                    <div
                      key={milestone.monthLabel}
                      style={{
                        padding: "18px",
                        borderRadius: "18px",
                        background: "rgba(12, 12, 12, 0.98)",
                        border: "1px solid rgba(199, 173, 144, 0.12)",
                      }}
                    >
                      <p style={{ margin: "0 0 10px", fontWeight: 800 }}>
                        {milestone.monthLabel}
                      </p>
                      <div style={{ display: "grid", gap: "8px", marginBottom: "10px" }}>
                        {milestone.goals.map((goal) => (
                          <div
                            key={goal}
                            style={{
                              padding: "10px 12px",
                              borderRadius: "12px",
                              background: "rgba(24, 24, 24, 0.98)",
                              color: "var(--off-white-soft)",
                              lineHeight: 1.6,
                            }}
                          >
                            {goal}
                          </div>
                        ))}
                      </div>
                      <p style={{ margin: 0, color: "var(--muted-stone)", lineHeight: 1.7 }}>
                        Target outcome: {milestone.targetOutcome}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
