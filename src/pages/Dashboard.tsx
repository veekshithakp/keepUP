import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DashboardMetricCard, DashboardPanel } from "../components/dashboard";
import { useAuth, useDashboardData, usePwa } from "../hooks";
import { routePaths } from "../routes";
import { getUserDisplayName } from "../utils";

const accentColors = {
  study: "radial-gradient(circle, rgba(224, 207, 187, 0.92) 0%, rgba(224, 207, 187, 0) 72%)",
  jobs: "radial-gradient(circle, rgba(199, 173, 144, 0.88) 0%, rgba(199, 173, 144, 0) 72%)",
  roadmap: "radial-gradient(circle, rgba(185, 175, 163, 0.88) 0%, rgba(185, 175, 163, 0) 72%)",
  readiness: "radial-gradient(circle, rgba(247, 243, 235, 0.92) 0%, rgba(247, 243, 235, 0) 72%)",
  goals: "radial-gradient(circle, rgba(216, 203, 188, 0.88) 0%, rgba(216, 203, 188, 0) 72%)",
  weekly: "radial-gradient(circle, rgba(163, 157, 150, 0.88) 0%, rgba(163, 157, 150, 0) 72%)",
  ai: "radial-gradient(circle, rgba(230, 220, 207, 0.88) 0%, rgba(230, 220, 207, 0) 72%)",
};

const chartAxisStyle = {
  fontSize: 12,
  fill: "#b2aaa0",
};

const actionButtonStyle = {
  padding: "12px 18px",
  borderRadius: "14px",
  border: "1px solid rgba(199, 173, 144, 0.14)",
  background: "rgba(6, 6, 6, 0.96)",
  color: "var(--off-white)",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: "14px",
} as const;

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    canInstall,
    installApp,
    notificationPermission,
    enableNotifications,
    lastNotificationTitle,
  } = usePwa();
  const { data, loading, error } = useDashboardData(user?.uid);
  const [pwaMessage, setPwaMessage] = useState("");
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  async function handleLogout() {
    await logout();
    navigate(routePaths.login);
  }

  async function handleInstallApp() {
    const installed = await installApp();

    if (installed) {
      setPwaMessage("KeepUP is ready on your device as an installable app.");
    }
  }

  async function handleEnableNotifications() {
    setNotificationsLoading(true);
    setPwaMessage("");

    try {
      await enableNotifications();
      setPwaMessage(
        "Push notifications are enabled for this device and stored in Firestore.",
      );
    } catch (installError) {
      setPwaMessage(
        installError instanceof Error
          ? installError.message
          : "Unable to enable notifications right now.",
      );
    } finally {
      setNotificationsLoading(false);
    }
  }

  const profile = data?.profile;
  const analytics = data?.analytics;
  const readinessEngine = data?.readinessEngine;
  const trendData = analytics?.trend ?? [];
  const notificationsEnabled = notificationPermission === "granted";

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
              KeepUP Workspace
            </p>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(2rem, 5vw, 42px)",
                lineHeight: 1.02,
                fontWeight: 800,
              }}
            >
              {profile?.name
                ? `Welcome back, ${profile.name}`
                : `Welcome back${
                    user?.email ? `, ${getUserDisplayName(user.email)}` : ""
                  }`}
            </h1>
            <p
              style={{
                margin: "14px 0 0",
                maxWidth: "700px",
                color: "var(--muted-stone)",
                fontSize: "15px",
                lineHeight: 1.7,
              }}
            >
              This dashboard is powered by your real Firebase profile and
              Firestore collections. As you add study progress, goals,
              applications, and recommendations, this view updates with your live
              placement journey.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <Link
              to={routePaths.profile}
              style={actionButtonStyle}
            >
              Open Profile
            </Link>
            <Link
              to={routePaths.applications}
              style={actionButtonStyle}
            >
              Open Job Tracker
            </Link>
            <Link
              to={routePaths.coach}
              style={actionButtonStyle}
            >
              Open AI Coach
            </Link>
            <Link
              to={routePaths.resume}
              style={actionButtonStyle}
            >
              Open Resume Analyzer
            </Link>
            <Link
              to={routePaths.roadmap}
              style={actionButtonStyle}
            >
              Open Study Tracker
            </Link>
            {canInstall ? (
              <button
                type="button"
                onClick={handleInstallApp}
                style={{
                  ...actionButtonStyle,
                  cursor: "pointer",
                }}
              >
                Install App
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleEnableNotifications}
              disabled={notificationsEnabled || notificationsLoading}
              style={{
                ...actionButtonStyle,
                cursor:
                  notificationsEnabled || notificationsLoading
                    ? "not-allowed"
                    : "pointer",
                opacity: notificationsEnabled || notificationsLoading ? 0.7 : 1,
              }}
            >
              {notificationsEnabled
                ? "Notifications Enabled"
                : notificationsLoading
                  ? "Enabling Notifications..."
                  : "Enable Notifications"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: "12px 18px",
                borderRadius: "14px",
                border: "1px solid rgba(199, 173, 144, 0.18)",
                background: "linear-gradient(135deg, #f7f3eb, #c7ad90)",
                color: "#050505",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </header>

        {pwaMessage ? (
          <div
            style={{
              marginBottom: "18px",
              padding: "14px 16px",
              borderRadius: "16px",
              background: "rgba(199, 173, 144, 0.12)",
              border: "1px solid rgba(199, 173, 144, 0.2)",
              color: "var(--off-white)",
              lineHeight: 1.6,
            }}
          >
            {pwaMessage}
          </div>
        ) : null}

        {lastNotificationTitle ? (
          <div
            style={{
              marginBottom: "18px",
              padding: "14px 16px",
              borderRadius: "16px",
              background: "rgba(12, 12, 12, 0.96)",
              border: "1px solid rgba(199, 173, 144, 0.14)",
              color: "var(--off-white-soft)",
              lineHeight: 1.6,
            }}
          >
            Latest notification: {lastNotificationTitle}
          </div>
        ) : null}

        {error ? (
          <div
            style={{
              marginBottom: "18px",
              padding: "14px 16px",
              borderRadius: "16px",
              background: "rgba(127, 29, 29, 0.35)",
              border: "1px solid rgba(248, 113, 113, 0.35)",
              color: "#f0f0f0",
              lineHeight: 1.6,
            }}
          >
            {error}
          </div>
        ) : null}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "18px",
            marginBottom: "18px",
          }}
        >
          <DashboardMetricCard
            title="Total Study Hours"
            value={loading ? "Loading..." : analytics?.totalStudyHours.value ?? "0 hrs"}
            detail={
              loading
                ? "Loading your tracked study hours from Firestore."
                : analytics?.totalStudyHours.detail ??
                  "No tracked study hours found yet."
            }
            accent={accentColors.study}
          />
          <DashboardMetricCard
            title="Topics Completed"
            value={
              loading ? "Loading..." : analytics?.topicsCompleted.value ?? "0"
            }
            detail={
              loading
                ? "Loading completed topics from Firestore."
                : analytics?.topicsCompleted.detail ??
                  "No completed topics found yet."
            }
            accent={accentColors.study}
          />
          <DashboardMetricCard
            title="Applications Submitted"
            value={
              loading
                ? "Loading..."
                : analytics?.applicationsSubmitted.value ?? "0"
            }
            detail={
              loading
                ? "Loading your application records from Firestore."
                : analytics?.applicationsSubmitted.detail ??
                  "No applications have been submitted yet."
            }
            accent={accentColors.jobs}
          />
          <DashboardMetricCard
            title="Interviews Scheduled"
            value={
              loading
                ? "Loading..."
                : analytics?.interviewsScheduled.value ?? "0"
            }
            detail={
              loading
                ? "Checking interview activity from Firestore."
                : analytics?.interviewsScheduled.detail ??
                  "No interviews scheduled in Firestore yet."
            }
            accent={accentColors.jobs}
          />
          <DashboardMetricCard
            title="Roadmap Completion"
            value={
              loading ? "Loading..." : analytics?.roadmapCompletion.value ?? "0%"
            }
            detail={
              loading
                ? "Tracking roadmap milestones and tasks from Firestore."
                : analytics?.roadmapCompletion.detail ??
                  "Generate a roadmap to begin tracking progress."
            }
            accent={accentColors.roadmap}
          />
          <DashboardMetricCard
            title="Readiness Score"
            value={loading ? "Loading..." : analytics?.readinessScore.value ?? "0"}
            detail={
              loading
                ? "Calculating readiness from your stored data."
                : analytics?.readinessScore.detail ??
                  "Complete onboarding and add activity to improve the score."
            }
            accent={accentColors.readiness}
          />
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "18px",
            marginBottom: "18px",
          }}
        >
          <DashboardPanel
            title="Study Analytics"
            subtitle="This chart combines your real study hour fields and completed topic records from the last seven tracked days."
          >
            <div style={{ width: "100%", height: "320px" }}>
              <ResponsiveContainer>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="studyHoursFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c7ad90" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#c7ad90" stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id="topicsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f7f3eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f7f3eb" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(247, 243, 235, 0.08)" vertical={false} />
                  <XAxis dataKey="label" tick={chartAxisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={chartAxisStyle} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "14px",
                      border: "1px solid rgba(199, 173, 144, 0.16)",
                      background: "rgba(12, 12, 12, 0.98)",
                      color: "#f7f3eb",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="studyHours"
                    stroke="#c7ad90"
                    fill="url(#studyHoursFill)"
                    strokeWidth={3}
                    name="Study Hours"
                  />
                  <Area
                    type="monotone"
                    dataKey="topicsCompleted"
                    stroke="#f7f3eb"
                    fill="url(#topicsFill)"
                    strokeWidth={3}
                    name="Topics Completed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </DashboardPanel>

          <DashboardPanel
            title="Readiness Score"
            subtitle="A 0-100 placement score built from DSA progress, core subjects, projects, resume quality, applications, and interview performance."
          >
            <div style={{ width: "100%", height: "320px" }}>
              <ResponsiveContainer>
                <RadialBarChart
                  innerRadius="68%"
                  outerRadius="96%"
                  barSize={18}
                  data={[
                    {
                      name: "Readiness",
                      value: analytics?.readinessScore.rawValue ?? 0,
                      fill: "#e0cfbb",
                    },
                  ]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    angleAxisId={0}
                    tick={false}
                  />
                  <RadialBar
                    background={{ fill: "rgba(247, 243, 235, 0.08)" }}
                    dataKey="value"
                    cornerRadius={16}
                  />
                  <text
                    x="50%"
                    y="48%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#f7f3eb"
                    fontSize="42"
                    fontWeight="800"
                  >
                    {loading ? "--" : analytics?.readinessScore.rawValue ?? 0}
                  </text>
                  <text
                    x="50%"
                    y="60%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#b2aaa0"
                    fontSize="14"
                  >
                    Readiness / 100
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </DashboardPanel>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "18px",
            marginBottom: "18px",
          }}
        >
          <DashboardPanel
            title="Readiness Breakdown"
            subtitle="Each category contributes a weighted signal to the overall placement readiness engine."
          >
            <div style={{ display: "grid", gap: "14px" }}>
              {(readinessEngine?.factors ?? []).map((factor) => (
                <div
                  key={factor.id}
                  style={{
                    padding: "16px",
                    borderRadius: "18px",
                    background: "rgba(14, 14, 14, 0.98)",
                    border: "1px solid rgba(199, 173, 144, 0.12)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          color: "var(--off-white)",
                          fontWeight: 700,
                        }}
                      >
                        {factor.label}
                      </p>
                      <p
                        style={{
                          margin: "6px 0 0",
                          color: "var(--muted-stone)",
                          fontSize: "12px",
                        }}
                      >
                        Weight: {factor.weight}%
                      </p>
                    </div>
                    <span
                      style={{
                        color: "var(--off-white)",
                        fontWeight: 800,
                        fontSize: "18px",
                      }}
                    >
                      {loading ? "--" : `${factor.score}%`}
                    </span>
                  </div>

                  <div
                    style={{
                      height: "10px",
                      borderRadius: "999px",
                      background: "rgba(247, 243, 235, 0.09)",
                      overflow: "hidden",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: `${factor.score}%`,
                        height: "100%",
                        borderRadius: "999px",
                        background: "linear-gradient(135deg, #f7f3eb, #c7ad90)",
                      }}
                    />
                  </div>

                  <p
                    style={{
                      margin: 0,
                      color: "var(--off-white-soft)",
                      fontSize: "14px",
                      lineHeight: 1.6,
                    }}
                  >
                    {loading ? "Calculating this factor..." : factor.detail}
                  </p>
                </div>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel
            title="Weaknesses And Recommendations"
            subtitle="Focus here first to move the score fastest."
          >
            <div style={{ display: "grid", gap: "18px" }}>
              <div>
                <p
                  style={{
                    margin: "0 0 10px",
                    color: "var(--muted-stone)",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Weaknesses
                </p>
                <div style={{ display: "grid", gap: "10px" }}>
                  {(readinessEngine?.weaknesses ?? []).map((weakness) => (
                    <div
                      key={weakness}
                      style={{
                        padding: "14px 16px",
                        borderRadius: "16px",
                        background: "rgba(18, 14, 11, 0.98)",
                        border: "1px solid rgba(199, 173, 144, 0.16)",
                        color: "var(--off-white-soft)",
                        lineHeight: 1.6,
                      }}
                    >
                      {loading ? "Loading weaknesses..." : weakness}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p
                  style={{
                    margin: "0 0 10px",
                    color: "var(--muted-stone)",
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Recommendations
                </p>
                <div style={{ display: "grid", gap: "10px" }}>
                  {(readinessEngine?.recommendations ?? []).map((recommendation) => (
                    <div
                      key={recommendation}
                      style={{
                        padding: "14px 16px",
                        borderRadius: "16px",
                        background: "rgba(12, 12, 12, 0.98)",
                        border: "1px solid rgba(199, 173, 144, 0.12)",
                        color: "var(--off-white-soft)",
                        lineHeight: 1.6,
                      }}
                    >
                      {loading ? "Loading recommendations..." : recommendation}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DashboardPanel>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "18px",
          }}
        >
          <DashboardPanel
            title="Placement Pipeline"
            subtitle="Daily application submissions and interview scheduling from your Firestore application records."
          >
            <div style={{ width: "100%", height: "320px" }}>
              <ResponsiveContainer>
                <BarChart data={trendData} barGap={10}>
                  <CartesianGrid stroke="rgba(247, 243, 235, 0.08)" vertical={false} />
                  <XAxis dataKey="label" tick={chartAxisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={chartAxisStyle} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "14px",
                      border: "1px solid rgba(199, 173, 144, 0.16)",
                      background: "rgba(12, 12, 12, 0.98)",
                      color: "#f7f3eb",
                    }}
                  />
                  <Bar
                    dataKey="applicationsSubmitted"
                    fill="#e0cfbb"
                    radius={[8, 8, 0, 0]}
                    name="Applications Submitted"
                  />
                  <Bar
                    dataKey="interviewsScheduled"
                    fill="#938b81"
                    radius={[8, 8, 0, 0]}
                    name="Interviews Scheduled"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardPanel>

          <DashboardPanel
            title="Student Snapshot"
            subtitle="Your dashboard profile is pulled directly from the users/{uid} Firestore document."
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "14px",
              }}
            >
              {[
                { label: "Name", value: profile?.name ?? "Not added yet" },
                {
                  label: "University",
                  value: profile?.university ?? "Not added yet",
                },
                { label: "Degree", value: profile?.degree ?? "Not added yet" },
                {
                  label: "Graduation Year",
                  value: profile?.graduationYear ?? "Not added yet",
                },
                {
                  label: "Target Role",
                  value: profile?.targetRole ?? "Not added yet",
                },
                {
                  label: "Current CGPA",
                  value: profile?.currentCgpa ?? "Not added yet",
                },
                {
                  label: "Placement Status",
                  value: profile?.placementStatus ?? "Not added yet",
                },
                { label: "Email", value: user?.email ?? "Not available" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "16px",
                    borderRadius: "18px",
                    background: "rgba(14, 14, 14, 0.98)",
                    border: "1px solid rgba(199, 173, 144, 0.12)",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 8px",
                      color: "var(--muted-stone)",
                      fontSize: "12px",
                    }}
                  >
                    {item.label}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      color: "var(--off-white)",
                      lineHeight: 1.5,
                      fontWeight: 600,
                      wordBreak: "break-word",
                    }}
                  >
                    {loading ? "Loading..." : item.value}
                  </p>
                </div>
              ))}
            </div>
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}
