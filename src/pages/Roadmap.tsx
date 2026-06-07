import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  BookOpenText,
  CalendarDays,
  MoonStar,
} from "lucide-react";
import { TrackerOverviewCard } from "@/components/ui";
import { roadmapRoles } from "../data";
import {
  ProgressBar,
  StudyProgressCharts,
} from "../components/roadmap";
import { useAuth, useStudyTracker, useUserProfile, useUserRoadmap } from "../hooks";
import { routePaths } from "../routes";
import {
  createSubject,
  createTopic,
  generateAndSaveRoadmap,
  toggleTopicComplete,
  updateRoadmapTaskStatus,
  updateTopic,
} from "../services";
import type { CareerRole, UserRoadmap } from "../types";
import { getMilestoneTaskStats, getRoadmapTaskStats } from "../utils";

function parseResourceInput(value: string) {
  return value
    .split("\n")
    .map((resource) => resource.trim())
    .filter(Boolean);
}

export default function Roadmap() {
  const { user } = useAuth();
  const { profile } = useUserProfile(user?.uid);
  const { subjects, topics, loading, error, progress, engine } = useStudyTracker(
    user?.uid,
  );
  const {
    roadmap,
    loading: roadmapLoading,
    error: roadmapError,
  } = useUserRoadmap(user?.uid);

  const [subjectName, setSubjectName] = useState("");
  const [selectedRole, setSelectedRole] = useState<CareerRole>("");
  const [topicForm, setTopicForm] = useState({
    subjectId: "",
    title: "",
    notes: "",
    resources: "",
    estimatedHours: "",
    actualHours: "",
  });
  const [savingSubject, setSavingSubject] = useState(false);
  const [savingTopic, setSavingTopic] = useState(false);
  const [savingRoadmap, setSavingRoadmap] = useState(false);
  const [pageError, setPageError] = useState("");
  const currentTargetRole = selectedRole.trim() || profile?.targetRole?.trim() || "";

  const studyOverviewGraph = engine.weeklySeries.flatMap((day) => [
    {
      label: `${day.label} hours`,
      duration: Math.max(day.actualHours, 1),
      height: Math.min(Math.max(day.actualHours * 16, 18), 100),
      tone: "primary" as const,
    },
    {
      label: `${day.label} topics`,
      duration: Math.max(day.completedTopics, 1),
      height: Math.min(Math.max(day.completedTopics * 20, 18), 100),
      tone: "secondary" as const,
    },
  ]);

  const topicsBySubject = useMemo(
    () =>
      subjects.map((subject) => {
        const subjectTopics = topics.filter((topic) => topic.subjectId === subject.id);
        const completed = subjectTopics.filter((topic) => topic.completed).length;
        const estimatedHours = subjectTopics.reduce(
          (sum, topic) => sum + topic.estimatedHours,
          0,
        );
        const actualHours = subjectTopics.reduce(
          (sum, topic) => sum + topic.actualHours,
          0,
        );

        return {
          subject,
          topics: subjectTopics,
          completed,
          estimatedHours,
          actualHours,
        };
      }),
    [subjects, topics],
  );

  const roadmapProgress = useMemo(() => {
    const progressSnapshot = getRoadmapTaskStats(roadmap);

    return {
      totalTasks: progressSnapshot.totalTasks,
      completedTasks: progressSnapshot.completedTasks,
      percentage: progressSnapshot.completionPercentage,
    };
  }, [roadmap]);

  const suggestedRoles = useMemo(() => {
    const profileRole = profile?.targetRole?.trim();

    return Array.from(
      new Set(
        [profileRole, ...roadmapRoles]
          .filter((role): role is string => Boolean(role?.trim()))
          .map((role) => role.trim()),
      ),
    );
  }, [profile?.targetRole]);

  async function handleCreateSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !subjectName.trim()) {
      return;
    }

    setPageError("");
    setSavingSubject(true);

    try {
      await createSubject(user.uid, { name: subjectName });
      setSubjectName("");
    } catch (nextError) {
      setPageError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to create subject right now.",
      );
    } finally {
      setSavingSubject(false);
    }
  }

  async function handleCreateTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !topicForm.subjectId || !topicForm.title.trim()) {
      return;
    }

    setPageError("");
    setSavingTopic(true);

    try {
      await createTopic(user.uid, {
        subjectId: topicForm.subjectId,
        title: topicForm.title,
        notes: topicForm.notes,
        resources: parseResourceInput(topicForm.resources),
        estimatedHours: Number(topicForm.estimatedHours) || 0,
        actualHours: Number(topicForm.actualHours) || 0,
      });

      setTopicForm({
        subjectId: "",
        title: "",
        notes: "",
        resources: "",
        estimatedHours: "",
        actualHours: "",
      });
    } catch (nextError) {
      setPageError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to create topic right now.",
      );
    } finally {
      setSavingTopic(false);
    }
  }

  async function handleToggleTopic(topicId: string, completed: boolean) {
    if (!user) {
      return;
    }

    try {
      await toggleTopicComplete(user.uid, topicId, completed);
    } catch (nextError) {
      setPageError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to update topic status right now.",
      );
    }
  }

  async function handleSaveTopicHours(
    topicId: string,
    actualHours: number,
    estimatedHours: number,
    notes: string,
    resources: string[],
  ) {
    if (!user) {
      return;
    }

    try {
      await updateTopic(user.uid, topicId, {
        actualHours,
        estimatedHours,
        notes,
        resources,
      });
    } catch (nextError) {
      setPageError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to save topic changes right now.",
      );
    }
  }

  async function handleGenerateRoadmap() {
    if (!user || !currentTargetRole) {
      if (!currentTargetRole) {
        setPageError("Enter or select a target role first so KeepUP can generate the right roadmap.");
      }
      return;
    }

    setPageError("");
    setSavingRoadmap(true);

    try {
      await generateAndSaveRoadmap(user.uid, currentTargetRole);
    } catch (nextError) {
      setPageError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to generate roadmap right now.",
      );
    } finally {
      setSavingRoadmap(false);
    }
  }

  async function handleRoadmapTaskToggle(
    currentRoadmap: UserRoadmap,
    milestoneId: string,
    taskId: string,
    completed: boolean,
  ) {
    if (!user) {
      return;
    }

    setPageError("");

    try {
      await updateRoadmapTaskStatus(
        user.uid,
        currentRoadmap,
        milestoneId,
        taskId,
        completed,
      );
    } catch (nextError) {
      setPageError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to update roadmap task right now.",
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
              KeepUP Study Tracker
            </p>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(2rem, 5vw, 42px)",
                lineHeight: 1.04,
                fontWeight: 800,
              }}
            >
              Track subjects, topics, and real study progress
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
              Create subjects and topics, mark work complete, record notes,
              resources, estimated hours, and actual hours. Progress is saved to
              Firestore under your account and flows into dashboard analytics.
            </p>
          </div>

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
        </header>

        {(error || roadmapError || pageError) && (
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
            {pageError || roadmapError || error}
          </div>
        )}

        <section
          style={{
            padding: "24px",
            borderRadius: "24px",
            background: "rgba(8, 8, 8, 0.98)",
            border: "1px solid rgba(199, 173, 144, 0.12)",
            boxShadow: "0 28px 60px rgba(0, 0, 0, 0.28)",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "18px",
              alignItems: "flex-start",
              flexWrap: "wrap",
              marginBottom: "18px",
            }}
          >
            <div>
              <h2 style={{ margin: "0 0 10px", fontSize: "28px" }}>
                Roadmap Builder
              </h2>
              <p style={{ margin: 0, color: "var(--muted-stone)", lineHeight: 1.7 }}>
                Generate a roadmap aligned to your actual target role. KeepUP now
                uses your saved profile role first and can create custom roadmaps
                for non-tech roles like Marketing Manager too.
              </p>
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: "999px",
                background: "rgba(199, 173, 144, 0.14)",
                color: "var(--off-white)",
                fontWeight: 700,
              }}
            >
              {roadmap
                ? `Active Role: ${roadmap.role} • ${roadmapProgress.percentage}% complete`
                : "No roadmap saved yet"}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            {suggestedRoles.map((role) => {
              const isSelected = currentTargetRole === role;

              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "16px",
                    border: isSelected
                      ? "1px solid rgba(199, 173, 144, 0.34)"
                      : "1px solid rgba(199, 173, 144, 0.12)",
                    background: isSelected
                      ? "rgba(199, 173, 144, 0.16)"
                      : "rgba(16, 16, 16, 0.98)",
                    color: isSelected ? "#f7f3eb" : "var(--off-white-soft)",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {role}
                </button>
              );
            })}
          </div>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginBottom: "18px",
            }}
          >
            <span style={{ color: "var(--off-white-soft)", fontSize: "14px" }}>
              Target role
            </span>
            <input
              type="text"
              value={currentTargetRole}
              onChange={(event) => setSelectedRole(event.target.value)}
              placeholder="Enter your role, for example Marketing Manager"
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
            onClick={handleGenerateRoadmap}
            disabled={savingRoadmap}
            style={{
              padding: "14px 18px",
              border: "none",
              borderRadius: "14px",
              background: savingRoadmap
                ? "linear-gradient(135deg, #3d352c, #221c16)"
                : "linear-gradient(135deg, #f7f3eb, #c7ad90)",
              color: "#050505",
              fontWeight: 700,
              cursor: savingRoadmap ? "not-allowed" : "pointer",
              marginBottom: "20px",
            }}
          >
            {savingRoadmap ? "Generating..." : "Generate Roadmap"}
          </button>

          {roadmapLoading ? (
            <div
              style={{
                padding: "18px",
                borderRadius: "18px",
                background: "rgba(14, 14, 14, 0.98)",
                border: "1px solid rgba(199, 173, 144, 0.12)",
                color: "var(--off-white-soft)",
              }}
            >
              Loading your saved roadmap...
            </div>
          ) : roadmap ? (
            <div style={{ display: "grid", gap: "16px" }}>
              <ProgressBar
                label="Roadmap Completion"
                value={roadmapProgress.percentage}
                helper={`${roadmapProgress.completedTasks}/${roadmapProgress.totalTasks} roadmap tasks completed.`}
                accent="linear-gradient(135deg, #f7f3eb, #c7ad90)"
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "14px",
                }}
              >
                {roadmap.milestones.map((milestone) => {
                  const milestoneProgress = getMilestoneTaskStats(milestone);
                  const milestoneStatus =
                    milestoneProgress.completionPercentage === 100
                      ? "Completed"
                      : milestoneProgress.completedTasks > 0
                        ? "In Progress"
                        : "Not Started";

                  return (
                    <div
                      key={milestone.id}
                      style={{
                        padding: "18px",
                        borderRadius: "20px",
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
                        <h3 style={{ margin: 0, fontSize: "18px" }}>
                          {milestone.title}
                        </h3>
                        <span
                          style={{
                            color: "var(--off-white)",
                            fontWeight: 700,
                            fontSize: "13px",
                          }}
                        >
                          {milestoneProgress.completionPercentage}%
                        </span>
                      </div>
                      <p
                        style={{
                          margin: "0 0 12px",
                          color: "var(--off-white-soft)",
                          lineHeight: 1.6,
                        }}
                      >
                        {milestone.focus}
                      </p>
                      <p
                        style={{
                          margin: "0 0 12px",
                          color: "var(--muted-stone)",
                          fontSize: "13px",
                          lineHeight: 1.6,
                        }}
                      >
                        Status: {milestoneStatus} · {milestoneProgress.completedTasks}/
                        {milestoneProgress.totalTasks} tasks complete
                      </p>
                      <div
                        style={{
                          height: "8px",
                          borderRadius: "999px",
                          background: "rgba(247, 243, 235, 0.09)",
                          overflow: "hidden",
                          marginBottom: "14px",
                        }}
                      >
                        <div
                          style={{
                            width: `${milestoneProgress.completionPercentage}%`,
                            height: "100%",
                            borderRadius: "999px",
                            background: "linear-gradient(135deg, #f7f3eb, #c7ad90)",
                          }}
                        />
                      </div>
                      <div style={{ display: "grid", gap: "10px" }}>
                        {milestone.tasks.map((task) => (
                          <label
                            key={task.id}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "20px 1fr",
                              gap: "10px",
                              alignItems: "start",
                              padding: "12px",
                              borderRadius: "14px",
                              background: "rgba(18, 18, 18, 0.98)",
                              border: "1px solid rgba(199, 173, 144, 0.1)",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={(event) =>
                                handleRoadmapTaskToggle(
                                  roadmap,
                                  milestone.id,
                                  task.id,
                                  event.target.checked,
                                )
                              }
                            />
                            <div>
                              <p
                                style={{
                                  margin: 0,
                                  color: task.completed
                                    ? "var(--french-beige-soft)"
                                    : "var(--off-white)",
                                  lineHeight: 1.5,
                                  fontWeight: 600,
                                }}
                              >
                                {task.title}
                              </p>
                              <p
                                style={{
                                  margin: "6px 0 0",
                                  color: "var(--muted-stone)",
                                  fontSize: "13px",
                                }}
                              >
                                Deadline:{" "}
                                {task.deadline
                                  ? new Date(task.deadline).toLocaleDateString()
                                  : "Not set"}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: "18px",
                borderRadius: "18px",
                background: "rgba(14, 14, 14, 0.98)",
                border: "1px solid rgba(199, 173, 144, 0.12)",
                color: "var(--off-white-soft)",
              }}
            >
              Generate your first roadmap to save a role-based learning path in
              Firestore.
            </div>
          )}
        </section>

        <section style={{ marginBottom: "18px" }}>
          <TrackerOverviewCard
            title="Study Tracker"
            metrics={[
              {
                label: "Subjects",
                value: `${subjects.length}`,
                detail: "Study buckets",
              },
              {
                label: "Completion",
                value: `${engine.completionPercentage}%`,
                detail: `${progress.completedTopics}/${progress.totalTopics} topics`,
              },
              {
                label: "Time Left",
                value: `${engine.estimatedTimeLeft}h`,
                detail: `${engine.remainingTopics} topics remaining`,
              },
            ]}
            graphData={studyOverviewGraph}
            startLabel="Weekly activity"
            endLabel={`${engine.weeklyProgress}% momentum`}
            legend={[
              {
                label: "Actual Hours",
                value: `${progress.actualHours} hrs`,
                tone: "primary",
              },
              {
                label: "Completed",
                value: `${progress.completedTopics} topics`,
                tone: "secondary",
              },
              {
                label: "Estimated",
                value: `${progress.estimatedHours} hrs`,
                tone: "tertiary",
              },
              {
                label: "Remaining",
                value: `${engine.remainingTopics} topics`,
                tone: "quaternary",
              },
            ]}
            icons={{
              leading: <BookOpenText className="h-4 w-4" />,
              start: <MoonStar className="h-3.5 w-3.5" />,
              end: <CalendarDays className="h-3.5 w-3.5" />,
            }}
          />
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "18px",
            marginBottom: "18px",
          }}
        >
          <ProgressBar
            label="Overall Completion"
            value={engine.completionPercentage}
            helper={`${progress.completedTopics} completed and ${engine.remainingTopics} remaining.`}
          />
          <ProgressBar
            label="Weekly Momentum"
            value={engine.weeklyProgress}
            helper="Based on completion activity recorded during the last 7 tracked days."
            accent="linear-gradient(135deg, #e0cfbb, #b2aaa0)"
          />
        </section>

        <section style={{ marginBottom: "18px" }}>
          <StudyProgressCharts
            weeklySeries={engine.weeklySeries}
            subjectProgress={engine.subjectProgress}
          />
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "18px",
            marginBottom: "18px",
          }}
        >
          <form
            onSubmit={handleCreateSubject}
            style={{
              padding: "24px",
              borderRadius: "24px",
              background: "rgba(8, 8, 8, 0.98)",
              border: "1px solid rgba(199, 173, 144, 0.12)",
              boxShadow: "0 28px 60px rgba(0, 0, 0, 0.28)",
            }}
          >
            <h2 style={{ margin: "0 0 10px", fontSize: "24px" }}>Create Subject</h2>
            <p style={{ margin: "0 0 18px", color: "var(--muted-stone)", lineHeight: 1.7 }}>
              Add a subject to organize your study topics and track progress by area.
            </p>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ color: "var(--off-white-soft)" }}>Subject Name</span>
              <input
                value={subjectName}
                onChange={(event) => setSubjectName(event.target.value)}
                placeholder="Operating Systems"
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
            <button
              type="submit"
              disabled={savingSubject}
              style={{
                marginTop: "18px",
                padding: "14px 18px",
                border: "none",
                borderRadius: "14px",
                background: savingSubject
                  ? "linear-gradient(135deg, #3d352c, #221c16)"
                  : "linear-gradient(135deg, #f7f3eb, #c7ad90)",
                color: "#050505",
                fontWeight: 700,
                cursor: savingSubject ? "not-allowed" : "pointer",
              }}
            >
              {savingSubject ? "Creating..." : "Create Subject"}
            </button>
          </form>

          <form
            onSubmit={handleCreateTopic}
            style={{
              padding: "24px",
              borderRadius: "24px",
              background: "rgba(8, 8, 8, 0.98)",
              border: "1px solid rgba(199, 173, 144, 0.12)",
              boxShadow: "0 28px 60px rgba(0, 0, 0, 0.28)",
            }}
          >
            <h2 style={{ margin: "0 0 10px", fontSize: "24px" }}>Create Topic</h2>
            <p style={{ margin: "0 0 18px", color: "var(--muted-stone)", lineHeight: 1.7 }}>
              Add detailed topics with notes, resources, and planned vs actual study hours.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "14px",
              }}
            >
              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ color: "var(--off-white-soft)" }}>Subject</span>
                <select
                  value={topicForm.subjectId}
                  onChange={(event) =>
                    setTopicForm((current) => ({
                      ...current,
                      subjectId: event.target.value,
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
                >
                  <option value="" style={{ color: "#020617" }}>
                    Select subject
                  </option>
                  {subjects.map((subject) => (
                    <option
                      key={subject.id}
                      value={subject.id}
                      style={{ color: "#020617" }}
                    >
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ color: "var(--off-white-soft)" }}>Topic Title</span>
                <input
                  value={topicForm.title}
                  onChange={(event) =>
                    setTopicForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="CPU Scheduling"
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
                <span style={{ color: "var(--off-white-soft)" }}>Estimated Hours</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={topicForm.estimatedHours}
                  onChange={(event) =>
                    setTopicForm((current) => ({
                      ...current,
                      estimatedHours: event.target.value,
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
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ color: "var(--off-white-soft)" }}>Actual Hours</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={topicForm.actualHours}
                  onChange={(event) =>
                    setTopicForm((current) => ({
                      ...current,
                      actualHours: event.target.value,
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
                />
              </label>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "14px",
                marginTop: "14px",
              }}
            >
              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ color: "var(--off-white-soft)" }}>Notes</span>
                <textarea
                  value={topicForm.notes}
                  onChange={(event) =>
                    setTopicForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Key concepts, formulas, tricky areas..."
                  rows={5}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: "1px solid rgba(199, 173, 144, 0.12)",
                    background: "rgba(16, 16, 16, 0.98)",
                    color: "var(--off-white)",
                    fontSize: "15px",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ color: "var(--off-white-soft)" }}>Resources</span>
                <textarea
                  value={topicForm.resources}
                  onChange={(event) =>
                    setTopicForm((current) => ({
                      ...current,
                      resources: event.target.value,
                    }))
                  }
                  placeholder={"Add one resource per line\nhttps://...\nYouTube video title"}
                  rows={5}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "14px",
                    border: "1px solid rgba(199, 173, 144, 0.12)",
                    background: "rgba(16, 16, 16, 0.98)",
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
              disabled={savingTopic || subjects.length === 0}
              style={{
                marginTop: "18px",
                padding: "14px 18px",
                border: "none",
                borderRadius: "14px",
                background:
                  savingTopic || subjects.length === 0
                    ? "linear-gradient(135deg, #3d352c, #221c16)"
                    : "linear-gradient(135deg, #f7f3eb, #c7ad90)",
                color: "#050505",
                fontWeight: 700,
                cursor:
                  savingTopic || subjects.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              {savingTopic ? "Creating..." : "Create Topic"}
            </button>
          </form>
        </section>

        <section style={{ display: "grid", gap: "18px" }}>
          {loading ? (
            <div
              style={{
                padding: "24px",
                borderRadius: "24px",
                background: "rgba(8, 8, 8, 0.98)",
                border: "1px solid rgba(199, 173, 144, 0.12)",
                color: "var(--off-white-soft)",
              }}
            >
              Loading your study tracker...
            </div>
          ) : topicsBySubject.length ? (
            topicsBySubject.map(({ subject, topics: subjectTopics, completed, estimatedHours, actualHours }) => (
              <article
                key={subject.id}
                style={{
                  padding: "24px",
                  borderRadius: "24px",
                  background: "rgba(8, 8, 8, 0.98)",
                  border: "1px solid rgba(199, 173, 144, 0.12)",
                  boxShadow: "0 28px 60px rgba(0, 0, 0, 0.28)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "14px",
                    alignItems: "center",
                    flexWrap: "wrap",
                    marginBottom: "18px",
                  }}
                >
                  <div>
                    <h2 style={{ margin: "0 0 8px", fontSize: "28px" }}>{subject.name}</h2>
                    <p style={{ margin: 0, color: "var(--muted-stone)" }}>
                      {completed}/{subjectTopics.length} topics completed,{" "}
                      {estimatedHours}h estimated, {actualHours}h actual
                    </p>
                  </div>
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "999px",
                      background: "rgba(199, 173, 144, 0.14)",
                      color: "var(--off-white)",
                      fontWeight: 700,
                    }}
                  >
                    {subjectTopics.length
                      ? `${Math.round((completed / subjectTopics.length) * 100)}% complete`
                      : "No topics yet"}
                  </div>
                </div>

                {subjectTopics.length ? (
                  <div style={{ display: "grid", gap: "14px" }}>
                    <div
                      style={{
                        height: "10px",
                        borderRadius: "999px",
                        background: "rgba(247, 243, 235, 0.09)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${
                            subjectTopics.length
                              ? Math.round((completed / subjectTopics.length) * 100)
                              : 0
                          }%`,
                          height: "100%",
                          borderRadius: "999px",
                          background:
                            "linear-gradient(135deg, #f7f3eb, #c7ad90)",
                        }}
                      />
                    </div>
                    {subjectTopics.map((topic) => (
                      <StudyTopicCard
                        key={topic.id}
                        topic={topic}
                        onToggleComplete={handleToggleTopic}
                        onSave={handleSaveTopicHours}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "18px",
                      borderRadius: "18px",
                      background: "rgba(14, 14, 14, 0.98)",
                      border: "1px solid rgba(199, 173, 144, 0.12)",
                      color: "var(--off-white-soft)",
                    }}
                  >
                    No topics added to this subject yet.
                  </div>
                )}
              </article>
            ))
          ) : (
            <div
              style={{
                padding: "24px",
                borderRadius: "24px",
                background: "rgba(8, 8, 8, 0.98)",
                border: "1px solid rgba(199, 173, 144, 0.12)",
                color: "var(--off-white-soft)",
              }}
            >
              Create your first subject and topic to start tracking study progress.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StudyTopicCard({
  topic,
  onToggleComplete,
  onSave,
}: {
  topic: {
    id: string;
    title: string;
    notes: string;
    resources: string[];
    estimatedHours: number;
    actualHours: number;
    completed: boolean;
  };
  onToggleComplete: (topicId: string, completed: boolean) => Promise<void>;
  onSave: (
    topicId: string,
    actualHours: number,
    estimatedHours: number,
    notes: string,
    resources: string[],
  ) => Promise<void>;
}) {
  const [actualHours, setActualHours] = useState(String(topic.actualHours));
  const [estimatedHours, setEstimatedHours] = useState(String(topic.estimatedHours));
  const [notes, setNotes] = useState(topic.notes);
  const [resources, setResources] = useState(topic.resources.join("\n"));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);

    try {
      await onSave(
        topic.id,
        Number(actualHours) || 0,
        Number(estimatedHours) || 0,
        notes,
        parseResourceInput(resources),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "20px",
        background: "rgba(14, 14, 14, 0.98)",
        border: "1px solid rgba(199, 173, 144, 0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "14px",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: "14px",
        }}
      >
        <div>
          <h3 style={{ margin: "0 0 6px", fontSize: "20px" }}>{topic.title}</h3>
          <p style={{ margin: 0, color: "var(--muted-stone)" }}>
            Estimated {topic.estimatedHours}h • Actual {topic.actualHours}h
          </p>
        </div>

        <label
          style={{
            display: "inline-flex",
            gap: "10px",
            alignItems: "center",
            color: topic.completed ? "var(--french-beige-soft)" : "var(--off-white-soft)",
            fontWeight: 700,
          }}
        >
          <input
            type="checkbox"
            checked={topic.completed}
            onChange={(event) => onToggleComplete(topic.id, event.target.checked)}
          />
          Completed
        </label>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ color: "var(--off-white-soft)", fontSize: "14px" }}>Estimated Hours</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={estimatedHours}
            onChange={(event) => setEstimatedHours(event.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid rgba(199, 173, 144, 0.12)",
              background: "rgba(16, 16, 16, 0.98)",
              color: "var(--off-white)",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ color: "var(--off-white-soft)", fontSize: "14px" }}>Actual Hours</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={actualHours}
            onChange={(event) => setActualHours(event.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid rgba(199, 173, 144, 0.12)",
              background: "rgba(16, 16, 16, 0.98)",
              color: "var(--off-white)",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </label>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "12px",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ color: "var(--off-white-soft)", fontSize: "14px" }}>Notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid rgba(199, 173, 144, 0.12)",
              background: "rgba(16, 16, 16, 0.98)",
              color: "var(--off-white)",
              fontSize: "14px",
              boxSizing: "border-box",
              resize: "vertical",
            }}
          />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ color: "var(--off-white-soft)", fontSize: "14px" }}>Resources</span>
          <textarea
            value={resources}
            onChange={(event) => setResources(event.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid rgba(199, 173, 144, 0.12)",
              background: "rgba(16, 16, 16, 0.98)",
              color: "var(--off-white)",
              fontSize: "14px",
              boxSizing: "border-box",
              resize: "vertical",
            }}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{
          marginTop: "14px",
          padding: "12px 16px",
          border: "none",
          borderRadius: "12px",
          background: saving
            ? "linear-gradient(135deg, #3d352c, #221c16)"
            : "linear-gradient(135deg, #f7f3eb, #c7ad90)",
          color: "#050505",
          fontWeight: 700,
          cursor: saving ? "not-allowed" : "pointer",
        }}
      >
        {saving ? "Saving..." : "Save Topic Changes"}
      </button>
    </div>
  );
}
