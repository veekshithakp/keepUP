import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  type DocumentData,
  type Timestamp,
} from "firebase/firestore";
import type {
  AnalyticsMetric,
  AnalyticsTrendPoint,
  DashboardData,
  DashboardMetric,
  PlacementReadinessEngine,
  PlacementReadinessFactor,
  RecommendationItem,
  UserRoadmap,
  UserProfileRecord,
} from "../types";
import { getRoadmapTaskStats } from "../utils";
import { db } from "./firebase";

function isCompleted(data: DocumentData) {
  const status =
    typeof data.status === "string" ? data.status.toLowerCase() : undefined;

  return (
    data.completed === true ||
    status === "completed" ||
    status === "done" ||
    status === "success"
  );
}

function getNumericValue(value: unknown) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function getStudyHours(data: DocumentData) {
  return getNumericValue(
    data.studyHours ??
      data.actualHours ??
      data.estimatedHours ??
      data.hours ??
      data.hoursSpent ??
      data.durationHours ??
      data.duration,
  );
}

function clampScore(value: number) {
  return Math.max(0, Math.min(Math.round(value), 100));
}

function isInterviewScheduled(data: DocumentData) {
  const status =
    typeof data.status === "string" ? data.status.toLowerCase() : "";
  const stage = typeof data.stage === "string" ? data.stage.toLowerCase() : "";

  return (
    data.interviewScheduled === true ||
    status.includes("interview") ||
    status.includes("hr") ||
    stage.includes("interview")
  );
}

function getDocumentDate(data: DocumentData) {
  const possibleDate = [
    data.date,
    data.dateApplied,
    data.createdAt,
    data.updatedAt,
    data.dueDate,
    data.targetDate,
  ].find(Boolean);

  if (!possibleDate) {
    return null;
  }

  if (typeof possibleDate === "string" || typeof possibleDate === "number") {
    const date = new Date(possibleDate);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (
    typeof possibleDate === "object" &&
    possibleDate !== null &&
    "toDate" in possibleDate
  ) {
    return (possibleDate as Timestamp).toDate();
  }

  return null;
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function createStudyProgressMetric(studyDocs: DocumentData[]): DashboardMetric {
  const total = studyDocs.length;
  const completed = studyDocs.filter(isCompleted).length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    value: total === 0 ? "No plans yet" : `${completionRate}%`,
    detail:
      total === 0
        ? "No topic documents found in Firestore yet."
        : `${completed} of ${total} tracked topics completed`,
  };
}

function createJobApplicationsMetric(
  applicationDocs: DocumentData[],
): DashboardMetric {
  const total = applicationDocs.length;
  const active = applicationDocs.filter((application) => {
    const status =
      typeof application.status === "string"
        ? application.status.toLowerCase()
        : "";

    return !["rejected", "withdrawn", "closed", "placed"].includes(status);
  }).length;

  return {
    value: `${total}`,
    detail:
      total === 0
        ? "No job application records found yet."
        : `${active} active application${active === 1 ? "" : "s"} in progress`,
  };
}

function createDailyGoalsMetric(goalDocs: DocumentData[]): DashboardMetric {
  const today = new Date();
  const todaysGoals = goalDocs.filter((goal) => {
    const goalDate = getDocumentDate(goal);

    return goalDate ? isSameDay(goalDate, today) : true;
  });
  const completed = todaysGoals.filter(isCompleted).length;
  const pending = Math.max(todaysGoals.length - completed, 0);

  return {
    value: `${completed}/${todaysGoals.length || 0}`,
    detail:
      todaysGoals.length === 0
        ? "No daily goals saved for today."
        : `${pending} goal${pending === 1 ? "" : "s"} still pending today`,
  };
}

function createWeeklyProgressMetric(goalDocs: DocumentData[]): DashboardMetric {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);

  const weeklyGoals = goalDocs.filter((goal) => {
    const goalDate = getDocumentDate(goal);

    if (!goalDate) {
      return false;
    }

    return goalDate >= weekAgo && goalDate <= now;
  });
  const completed = weeklyGoals.filter(isCompleted).length;
  const completionRate =
    weeklyGoals.length === 0 ? 0 : Math.round((completed / weeklyGoals.length) * 100);

  return {
    value: weeklyGoals.length === 0 ? "No data" : `${completionRate}%`,
    detail:
      weeklyGoals.length === 0
        ? "No weekly goal history available yet."
        : `${completed} of ${weeklyGoals.length} tracked goals completed this week`,
  };
}

function createRecommendations(
  recommendationDocs: DocumentData[],
  profile: UserProfileRecord | null,
  studyDocs: DocumentData[],
  applicationDocs: DocumentData[],
  roadmap: UserRoadmap | null,
  readinessEngine: PlacementReadinessEngine,
): RecommendationItem[] {
  const generatedRecommendations: RecommendationItem[] = [];
  const roadmapProgress = getRoadmapTaskStats(roadmap);
  const dsaScore = readinessEngine.factors.find((factor) => factor.id === "dsa")?.score ?? 0;
  const projectsScore =
    readinessEngine.factors.find((factor) => factor.id === "projects")?.score ?? 0;
  const applicationsScore =
    readinessEngine.factors.find((factor) => factor.id === "applications")?.score ?? 0;
  const coreSubjectsScore =
    readinessEngine.factors.find((factor) => factor.id === "core-subjects")?.score ?? 0;

  if (roadmap && dsaScore < 70) {
    generatedRecommendations.push({
      id: "dsa-progress",
      title: "DSA Progress",
      message: `You have completed only ${dsaScore}% of DSA. Increase your DSA milestone progress before intensifying applications.`,
    });
  }

  const dsaMilestone = roadmap?.milestones.find((milestone) => milestone.title === "DSA");
  const graphTask = dsaMilestone?.tasks.find(
    (task) =>
      !task.completed &&
      task.title.toLowerCase().includes("graph"),
  );

  if (graphTask) {
    generatedRecommendations.push({
      id: "graphs-priority",
      title: "Graphs Priority",
      message:
        "Complete Graphs before applying to product companies. Strong graph problem solving improves your readiness for higher-bar interviews.",
    });
  }

  if (
    profile?.targetRole &&
    ["AI Engineer", "ML Engineer", "Data Scientist"].includes(profile.targetRole) &&
    projectsScore < 65
  ) {
    generatedRecommendations.push({
      id: "ml-project",
      title: "Project Depth",
      message: `Add one ML project to improve ${profile.targetRole} readiness and strengthen your portfolio signal.`,
    });
  }

  if (coreSubjectsScore < 65) {
    generatedRecommendations.push({
      id: "core-subjects",
      title: "Core Subjects",
      message:
        "Revise OS, DBMS, and CN in parallel. Core subject readiness is still a visible weakness for placements.",
    });
  }

  if (applicationsScore < 55 || applicationDocs.length < 5) {
    generatedRecommendations.push({
      id: "applications-pipeline",
      title: "Application Pipeline",
      message:
        "Increase your application volume and keep OA and interview rounds moving so your placement pipeline gains momentum.",
    });
  }

  if (roadmapProgress.totalTasks > 0 && roadmapProgress.completionPercentage < 50) {
    generatedRecommendations.push({
      id: "roadmap-momentum",
      title: "Roadmap Momentum",
      message: `Your roadmap is only ${roadmapProgress.completionPercentage}% complete. Finish more milestone tasks before widening your preparation scope.`,
    });
  }

  if (studyDocs.length > 0) {
    const completedTopics = studyDocs.filter(isCompleted).length;
    const studyCompletion = Math.round((completedTopics / studyDocs.length) * 100);

    if (studyCompletion < 60) {
      generatedRecommendations.push({
        id: "study-consistency",
        title: "Study Consistency",
        message: `Your tracked study completion is ${studyCompletion}%. Close incomplete topics to improve readiness faster.`,
      });
    }
  }

  const fallbackRecommendations = recommendationDocs
    .map((recommendation, index) => ({
      id: recommendation.id ?? `recommendation-${index}`,
      title:
        typeof recommendation.title === "string"
          ? recommendation.title
          : "Recommendation",
      message:
        typeof recommendation.message === "string"
          ? recommendation.message
          : typeof recommendation.description === "string"
            ? recommendation.description
            : "A recommendation document exists, but it does not include a readable message yet.",
      createdAt: getDocumentDate(recommendation)?.getTime() ?? 0,
    }))
    .sort((left, right) => right.createdAt - left.createdAt)
    .slice(0, 3)
    .map((recommendation) => ({
      id: recommendation.id,
      title: recommendation.title,
      message: recommendation.message,
    }));

  return [...generatedRecommendations, ...fallbackRecommendations].slice(0, 5);
}

function createPlacementReadinessMetric(
  profile: UserProfileRecord | null,
  readinessEngine: PlacementReadinessEngine,
): DashboardMetric {
  if (!profile) {
    return {
      value: `${readinessEngine.overallScore}`,
      detail:
        "Complete onboarding so the readiness engine can use more profile context.",
    };
  }

  const lowestFactor = [...readinessEngine.factors].sort(
    (left, right) => left.score - right.score,
  )[0];

  return {
    value: `${readinessEngine.overallScore}`,
    detail:
      lowestFactor
        ? `Most urgent gap: ${lowestFactor.label} at ${lowestFactor.score}%.`
        : "Built from DSA, core subjects, projects, resume, applications, and interview performance.",
  };
}

function formatTrendLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(date);
}

function createAnalyticsMetric(
  rawValue: number,
  formatter: (value: number) => string,
  detail: string,
): AnalyticsMetric {
  return {
    rawValue,
    value: formatter(rawValue),
    detail,
  };
}

function createRoadmapCompletionMetric(
  roadmap: UserRoadmap | null,
): AnalyticsMetric {
  const progress = getRoadmapTaskStats(roadmap);

  return createAnalyticsMetric(
    progress.completionPercentage,
    (value) => `${value}%`,
    progress.totalTasks === 0
      ? "Generate a roadmap to begin tracking milestone progress."
      : `${progress.completedTasks} of ${progress.totalTasks} roadmap tasks completed.`,
  );
}

function createTrendSeries(
  studyDocs: DocumentData[],
  applicationDocs: DocumentData[],
): AnalyticsTrendPoint[] {
  const now = new Date();
  const days: AnalyticsTrendPoint[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const currentDate = new Date(now);
    currentDate.setHours(0, 0, 0, 0);
    currentDate.setDate(now.getDate() - offset);

    days.push({
      label: formatTrendLabel(currentDate),
      studyHours: 0,
      topicsCompleted: 0,
      applicationsSubmitted: 0,
      interviewsScheduled: 0,
    });
  }

  const matchTrendPoint = (date: Date) =>
    days.find((_, index) => {
      const targetDate = new Date(now);
      targetDate.setHours(0, 0, 0, 0);
      targetDate.setDate(now.getDate() - (6 - index));

      return isSameDay(targetDate, date);
    });

  studyDocs.forEach((document) => {
    const date = getDocumentDate(document);

    if (!date) {
      return;
    }

    const point = matchTrendPoint(date);

    if (!point) {
      return;
    }

    point.studyHours += getStudyHours(document);

    if (isCompleted(document)) {
      point.topicsCompleted += 1;
    }
  });

  applicationDocs.forEach((document) => {
    const date = getDocumentDate(document);

    if (!date) {
      return;
    }

    const point = matchTrendPoint(date);

    if (!point) {
      return;
    }

    point.applicationsSubmitted += 1;

    if (isInterviewScheduled(document)) {
      point.interviewsScheduled += 1;
    }
  });

  return days;
}

function getMilestoneCompletionScore(
  roadmap: UserRoadmap | null,
  milestoneTitles: string[],
) {
  if (!roadmap) {
    return 0;
  }

  const relevantMilestones = roadmap.milestones.filter((milestone) =>
    milestoneTitles.includes(milestone.title),
  );

  if (relevantMilestones.length === 0) {
    return 0;
  }

  const tasks = relevantMilestones.flatMap((milestone) => milestone.tasks);

  if (tasks.length === 0) {
    return 0;
  }

  const completedTasks = tasks.filter((task) => task.completed).length;

  return clampScore((completedTasks / tasks.length) * 100);
}

function getResumeScore(resumeData: DocumentData | null) {
  if (!resumeData) {
    return 0;
  }

  const explicitScore =
    resumeData.score ??
    resumeData.resumeScore ??
    resumeData.overallScore ??
    resumeData.readinessScore;

  if (explicitScore !== undefined) {
    const parsedScore = getNumericValue(explicitScore);

    return clampScore(parsedScore <= 1 ? parsedScore * 100 : parsedScore);
  }

  const sections = [
    resumeData.summary,
    resumeData.projects,
    resumeData.skills,
    resumeData.education,
    resumeData.experience,
    resumeData.achievements,
    resumeData.resumeUrl,
  ];
  const completedSections = sections.filter((section) => {
    if (Array.isArray(section)) {
      return section.length > 0;
    }

    if (typeof section === "string") {
      return section.trim().length > 0;
    }

    return Boolean(section);
  }).length;

  return clampScore((completedSections / sections.length) * 100);
}

function getInterviewPerformanceScore(interviewDocs: DocumentData[]) {
  if (interviewDocs.length === 0) {
    return 0;
  }

  const scores = interviewDocs
    .map((document) => {
      const explicitScore =
        document.score ?? document.rating ?? document.performanceScore ?? document.feedbackScore;

      if (explicitScore !== undefined) {
        const parsedScore = getNumericValue(explicitScore);
        return parsedScore <= 10 ? parsedScore * 10 : parsedScore;
      }

      const outcome =
        typeof document.outcome === "string" ? document.outcome.toLowerCase() : "";
      const status =
        typeof document.status === "string" ? document.status.toLowerCase() : "";

      if (outcome.includes("excellent") || status.includes("excellent")) {
        return 90;
      }

      if (outcome.includes("good") || status.includes("good")) {
        return 75;
      }

      if (outcome.includes("average") || status.includes("average")) {
        return 60;
      }

      if (outcome.includes("poor") || status.includes("poor")) {
        return 35;
      }

      return 50;
    })
    .map(clampScore);

  const averageScore =
    scores.reduce((sum, score) => sum + score, 0) / scores.length;

  return clampScore(averageScore);
}

function createReadinessFactor(
  factor: Omit<PlacementReadinessFactor, "score"> & { score: number },
): PlacementReadinessFactor {
  return {
    ...factor,
    score: clampScore(factor.score),
  };
}

function buildPlacementReadinessEngine(params: {
  profile: UserProfileRecord | null;
  studyDocs: DocumentData[];
  applicationDocs: DocumentData[];
  roadmap: UserRoadmap | null;
  resumeData: DocumentData | null;
  interviewDocs: DocumentData[];
}): PlacementReadinessEngine {
  const { profile, studyDocs, applicationDocs, roadmap, resumeData, interviewDocs } =
    params;

  const dsaScore = getMilestoneCompletionScore(roadmap, ["DSA"]);
  const coreSubjectsScore = getMilestoneCompletionScore(roadmap, ["OS", "DBMS", "CN"]);
  const projectsRoadmapScore = getMilestoneCompletionScore(roadmap, ["Projects"]);
  const applicationsInterviewScore = applicationDocs.filter(isInterviewScheduled).length;
  const offerScore = applicationDocs.filter((document) => {
    const status =
      typeof document.status === "string" ? document.status.toLowerCase() : "";
    return status === "offer";
  }).length;
  const applicationScore = clampScore(
    Math.min(applicationDocs.length * 12, 60) +
      Math.min(applicationsInterviewScore * 15, 25) +
      Math.min(offerScore * 15, 15),
  );
  const resumeScore = getResumeScore(resumeData);
  const interviewPerformanceScore = getInterviewPerformanceScore(interviewDocs);
  const projectsTopicBonus = studyDocs.some((document) => {
    const title = typeof document.title === "string" ? document.title.toLowerCase() : "";
    const subject = typeof document.subjectName === "string"
      ? document.subjectName.toLowerCase()
      : "";

    return title.includes("project") || subject.includes("project");
  })
    ? 10
    : 0;
  const projectsScore = clampScore(projectsRoadmapScore + projectsTopicBonus);

  const factors: PlacementReadinessFactor[] = [
    createReadinessFactor({
      id: "dsa",
      label: "DSA Progress",
      weight: 20,
      score: dsaScore,
      detail:
        dsaScore === 0
          ? "No meaningful DSA roadmap progress detected yet."
          : `${dsaScore}% of the DSA milestone is complete.`,
      recommendation:
        "Prioritize arrays, strings, trees, graphs, and timed problem-solving practice.",
    }),
    createReadinessFactor({
      id: "core-subjects",
      label: "Core Subjects",
      weight: 20,
      score: coreSubjectsScore,
      detail:
        coreSubjectsScore === 0
          ? "OS, DBMS, and CN milestones are still mostly untouched."
          : `${coreSubjectsScore}% progress across OS, DBMS, and CN milestones.`,
      recommendation:
        "Revise OS, DBMS, and CN consistently and prepare interview-ready answers for each topic.",
    }),
    createReadinessFactor({
      id: "projects",
      label: "Projects",
      weight: 15,
      score: projectsScore,
      detail:
        projectsScore === 0
          ? "No project progress signal has been recorded yet."
          : `${projectsScore}% project readiness based on roadmap and tracked study work.`,
      recommendation:
        "Ship resume-worthy projects with clear impact, deployment, and strong project walkthroughs.",
    }),
    createReadinessFactor({
      id: "resume",
      label: "Resume",
      weight: 15,
      score: resumeScore,
      detail:
        resumeScore === 0
          ? "No resume score or resume document was found in Firestore yet."
          : `${resumeScore}% resume readiness based on stored resume data.`,
      recommendation:
        "Add a reviewed resume document and strengthen summaries, projects, skills, and quantified impact.",
    }),
    createReadinessFactor({
      id: "applications",
      label: "Applications",
      weight: 15,
      score: applicationScore,
      detail:
        applicationDocs.length === 0
          ? "No application activity has been tracked yet."
          : `${applicationDocs.length} applications tracked with ${applicationsInterviewScore} interview-stage signals and ${offerScore} offers.`,
      recommendation:
        "Apply consistently, follow up on OA and interview rounds, and widen your role/company pipeline.",
    }),
    createReadinessFactor({
      id: "interview-performance",
      label: "Interview Performance",
      weight: 15,
      score: interviewPerformanceScore,
      detail:
        interviewDocs.length === 0
          ? "No interview performance feedback is stored yet."
          : `${interviewDocs.length} interview feedback record${
              interviewDocs.length === 1 ? "" : "s"
            } contributing to the score.`,
      recommendation:
        "Log mock or real interview feedback and focus on communication, problem solving, and follow-up review.",
    }),
  ];

  const overallScore = clampScore(
    factors.reduce((sum, factor) => sum + (factor.score * factor.weight) / 100, 0),
  );

  const weaknessFactors = [...factors]
    .sort((left, right) => left.score - right.score)
    .filter((factor) => factor.score < 70)
    .slice(0, 3);

  const weaknesses =
    weaknessFactors.length > 0
      ? weaknessFactors.map(
          (factor) => `${factor.label}: ${factor.detail}`,
        )
      : ["No major weaknesses detected right now. Keep compounding consistent progress."];

  const recommendations =
    weaknessFactors.length > 0
      ? weaknessFactors.map((factor) => factor.recommendation)
      : [
          "Maintain your strongest areas and convert that momentum into more interview and offer outcomes.",
        ];

  if (!profile) {
    recommendations.unshift(
      "Complete onboarding details so the readiness engine can personalize the score more accurately.",
    );
  }

  return {
    overallScore,
    factors,
    weaknesses,
    recommendations,
  };
}

function createAnalytics(
  studyDocs: DocumentData[],
  applicationDocs: DocumentData[],
  roadmap: UserRoadmap | null,
  readinessEngine: PlacementReadinessEngine,
): DashboardData["analytics"] {
  const totalStudyHours = studyDocs.reduce(
    (sum, document) => sum + getStudyHours(document),
    0,
  );
  const topicsCompleted = studyDocs.filter(isCompleted).length;
  const applicationsSubmitted = applicationDocs.length;
  const interviewsScheduled = applicationDocs.filter(isInterviewScheduled).length;
  const readiness = readinessEngine.overallScore;

  return {
    totalStudyHours: createAnalyticsMetric(
      totalStudyHours,
      (value) => `${value.toFixed(value % 1 === 0 ? 0 : 1)} hrs`,
      "Summed from study progress documents that include tracked hour fields.",
    ),
    topicsCompleted: createAnalyticsMetric(
      topicsCompleted,
      (value) => `${value}`,
      "Counted from completed study progress items in Firestore.",
    ),
    applicationsSubmitted: createAnalyticsMetric(
      applicationsSubmitted,
      (value) => `${value}`,
      "Total application documents saved under your account.",
    ),
    interviewsScheduled: createAnalyticsMetric(
      interviewsScheduled,
      (value) => `${value}`,
      "Applications marked with an interview status or scheduled interview flag.",
    ),
    roadmapCompletion: createRoadmapCompletionMetric(roadmap),
    readinessScore: createAnalyticsMetric(
      readiness,
      (value) => `${value}`,
      "Calculated from DSA progress, core subjects, projects, resume, applications, and interview performance.",
    ),
    trend: createTrendSeries(studyDocs, applicationDocs),
  };
}

function buildDashboardData(params: {
  profile: UserProfileRecord | null;
  studyDocs: DocumentData[];
  applicationDocs: DocumentData[];
  dailyGoalDocs: DocumentData[];
  recommendationDocs: DocumentData[];
  roadmap: UserRoadmap | null;
  resumeData: DocumentData | null;
  interviewDocs: DocumentData[];
}): DashboardData {
  const {
    profile,
    studyDocs,
    applicationDocs,
    dailyGoalDocs,
    recommendationDocs,
    roadmap,
    resumeData,
    interviewDocs,
  } = params;
  const readinessEngine = buildPlacementReadinessEngine({
    profile,
    studyDocs,
    applicationDocs,
    roadmap,
    resumeData,
    interviewDocs,
  });

  return {
    profile,
    studyProgress: createStudyProgressMetric(studyDocs),
    jobApplications: createJobApplicationsMetric(applicationDocs),
    placementReadiness: createPlacementReadinessMetric(profile, readinessEngine),
    readinessEngine,
    dailyGoals: createDailyGoalsMetric(dailyGoalDocs),
    weeklyProgress: createWeeklyProgressMetric(dailyGoalDocs),
    analytics: createAnalytics(studyDocs, applicationDocs, roadmap, readinessEngine),
    recommendations: createRecommendations(
      recommendationDocs,
      profile,
      studyDocs,
      applicationDocs,
      roadmap,
      readinessEngine,
    ),
  };
}

export function subscribeToDashboardData(
  uid: string,
  onData: (data: DashboardData) => void,
  onError: (error: Error) => void,
) {
  const state: {
    profile: UserProfileRecord | null;
    studyDocs: DocumentData[];
    applicationDocs: DocumentData[];
    dailyGoalDocs: DocumentData[];
    recommendationDocs: DocumentData[];
    roadmap: UserRoadmap | null;
    resumeData: DocumentData | null;
    interviewDocs: DocumentData[];
  } = {
    profile: null,
    studyDocs: [],
    applicationDocs: [],
    dailyGoalDocs: [],
    recommendationDocs: [],
    roadmap: null,
    resumeData: null,
    interviewDocs: [],
  };

  const readyState = {
    profile: false,
    studyDocs: false,
    applicationDocs: false,
    dailyGoalDocs: false,
    recommendationDocs: false,
    roadmap: false,
    resumeData: false,
    interviewDocs: false,
  };

  function publishIfReady() {
    if (Object.values(readyState).every(Boolean)) {
      onData(buildDashboardData(state));
    }
  }

  const unsubscribers = [
    onSnapshot(
      doc(db, "users", uid),
      (snapshot) => {
        state.profile = snapshot.exists()
          ? (snapshot.data() as UserProfileRecord)
          : null;
        readyState.profile = true;
        publishIfReady();
      },
      onError,
    ),
    onSnapshot(
      collection(db, "users", uid, "topics"),
      (snapshot) => {
        state.studyDocs = snapshot.docs.map((document) => document.data());
        readyState.studyDocs = true;
        publishIfReady();
      },
      onError,
    ),
    onSnapshot(
      collection(db, "users", uid, "applications"),
      (snapshot) => {
        state.applicationDocs = snapshot.docs.map((document) => document.data());
        readyState.applicationDocs = true;
        publishIfReady();
      },
      onError,
    ),
    onSnapshot(
      collection(db, "users", uid, "dailyGoals"),
      (snapshot) => {
        state.dailyGoalDocs = snapshot.docs.map((document) => document.data());
        readyState.dailyGoalDocs = true;
        publishIfReady();
      },
      onError,
    ),
    onSnapshot(
      collection(db, "users", uid, "recommendations"),
      (snapshot) => {
        state.recommendationDocs = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));
        readyState.recommendationDocs = true;
        publishIfReady();
      },
      onError,
    ),
    onSnapshot(
      doc(db, "users", uid, "roadmaps", "active"),
      (snapshot) => {
        state.roadmap = snapshot.exists()
          ? (snapshot.data() as UserRoadmap)
          : null;
        readyState.roadmap = true;
        publishIfReady();
      },
      onError,
    ),
    onSnapshot(
      doc(db, "users", uid, "resume", "current"),
      (snapshot) => {
        state.resumeData = snapshot.exists() ? snapshot.data() : null;
        readyState.resumeData = true;
        publishIfReady();
      },
      onError,
    ),
    onSnapshot(
      collection(db, "users", uid, "interviewPerformance"),
      (snapshot) => {
        state.interviewDocs = snapshot.docs.map((document) => document.data());
        readyState.interviewDocs = true;
        publishIfReady();
      },
      onError,
    ),
  ];

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}

export async function getDashboardData(uid: string): Promise<DashboardData> {
  const userRef = doc(db, "users", uid);
  const userDocPromise = getDoc(userRef);
  const topicsPromise = getDocs(collection(db, "users", uid, "topics"));
  const applicationsPromise = getDocs(collection(db, "users", uid, "applications"));
  const dailyGoalsPromise = getDocs(collection(db, "users", uid, "dailyGoals"));
  const roadmapPromise = getDoc(doc(db, "users", uid, "roadmaps", "active"));
  const resumePromise = getDoc(doc(db, "users", uid, "resume", "current"));
  const interviewPerformancePromise = getDocs(
    collection(db, "users", uid, "interviewPerformance"),
  );
  const recommendationsPromise = getDocs(
    collection(db, "users", uid, "recommendations"),
  );

  const [
    userDoc,
    topicsSnapshot,
    applicationsSnapshot,
    dailyGoalsSnapshot,
    roadmapSnapshot,
    resumeSnapshot,
    interviewPerformanceSnapshot,
    recommendationsSnapshot,
  ] = await Promise.all([
    userDocPromise,
    topicsPromise,
    applicationsPromise,
    dailyGoalsPromise,
    roadmapPromise,
    resumePromise,
    interviewPerformancePromise,
    recommendationsPromise,
  ]);

  return buildDashboardData({
    profile: userDoc.exists() ? (userDoc.data() as UserProfileRecord) : null,
    studyDocs: topicsSnapshot.docs.map((document) => document.data()),
    applicationDocs: applicationsSnapshot.docs.map((document) => document.data()),
    dailyGoalDocs: dailyGoalsSnapshot.docs.map((document) => document.data()),
    roadmap: roadmapSnapshot.exists()
      ? (roadmapSnapshot.data() as UserRoadmap)
      : null,
    resumeData: resumeSnapshot.exists() ? resumeSnapshot.data() : null,
    interviewDocs: interviewPerformanceSnapshot.docs.map((document) =>
      document.data(),
    ),
    recommendationDocs: recommendationsSnapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    })),
  });
}
