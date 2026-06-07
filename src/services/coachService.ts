import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import type {
  CoachMessage,
  CreateCoachMessageInput,
  JobApplication,
  StudyTopic,
  UserProfileRecord,
  UserRoadmap,
} from "../types";
import { getRoadmapTaskStats } from "../utils";
import { db } from "./firebase";

interface GeminiCandidate {
  content?: {
    parts?: Array<{
      text?: string;
    }>;
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

interface CoachContext {
  profile: UserProfileRecord | null;
  roadmap: UserRoadmap | null;
  studyTopics: StudyTopic[];
  applications: JobApplication[];
}

const coachSystemInstruction = `
You are KeepUP AI Career Coach.
Help college students with:
- study advice
- placement guidance
- resume suggestions
- roadmap recommendations
- interview preparation

Be practical, encouraging, and specific.
Prefer short structured advice with clear next steps.
Always use the provided student context when it is relevant.
If context is missing, say what is missing instead of inventing it.
Personalize the response using the user's profile, roadmap progress, study progress, and job applications.
`.trim();

function normalizeTimestamp(value: unknown) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as Timestamp).toDate().toISOString();
  }

  return null;
}

function mapCoachMessage(
  documentId: string,
  data: Record<string, unknown>,
): CoachMessage {
  return {
    id: documentId,
    role: data.role === "model" ? "model" : "user",
    text: typeof data.text === "string" ? data.text : "",
    createdAt: normalizeTimestamp(data.createdAt),
    localCreatedAt:
      typeof data.localCreatedAt === "string"
        ? data.localCreatedAt
        : new Date().toISOString(),
  };
}

function sortCoachMessages(messages: CoachMessage[]) {
  return [...messages].sort((left, right) => {
    const leftDate = new Date(left.createdAt ?? left.localCreatedAt).getTime();
    const rightDate = new Date(right.createdAt ?? right.localCreatedAt).getTime();

    return leftDate - rightDate;
  });
}

function getNumericValue(value: unknown) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStudyTopic(
  documentId: string,
  data: Record<string, unknown>,
): StudyTopic {
  return {
    id: documentId,
    subjectId: typeof data.subjectId === "string" ? data.subjectId : "",
    title: typeof data.title === "string" ? data.title : "Untitled Topic",
    notes: typeof data.notes === "string" ? data.notes : "",
    resources: Array.isArray(data.resources)
      ? data.resources.filter((value): value is string => typeof value === "string")
      : [],
    estimatedHours: getNumericValue(data.estimatedHours),
    actualHours: getNumericValue(data.actualHours),
    completed: data.completed === true,
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function isApplicationStatus(value: unknown): value is JobApplication["status"] {
  return (
    value === "Applied" ||
    value === "OA" ||
    value === "Interview" ||
    value === "HR Round" ||
    value === "Rejected" ||
    value === "Offer"
  );
}

function normalizeApplication(
  documentId: string,
  data: Record<string, unknown>,
): JobApplication {
  return {
    id: documentId,
    company: typeof data.company === "string" ? data.company : "Unknown Company",
    role: typeof data.role === "string" ? data.role : "Unknown Role",
    location: typeof data.location === "string" ? data.location : "Unknown Location",
    dateApplied:
      typeof data.dateApplied === "string" ? data.dateApplied : new Date().toISOString(),
    status: isApplicationStatus(data.status) ? data.status : "Applied",
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function getReferenceDate(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export function subscribeToCoachMessages(
  uid: string,
  onData: (messages: CoachMessage[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    collection(db, "users", uid, "coachMessages"),
    (snapshot) => {
      const messages = sortCoachMessages(
        snapshot.docs.map((document) =>
          mapCoachMessage(document.id, document.data() as Record<string, unknown>),
        ),
      );

      onData(messages);
    },
    (error) => onError(error),
  );
}

export async function saveCoachMessage(
  uid: string,
  input: CreateCoachMessageInput,
) {
  await addDoc(collection(db, "users", uid, "coachMessages"), {
    role: input.role,
    text: input.text.trim(),
    localCreatedAt: new Date().toISOString(),
    createdAt: serverTimestamp(),
  });
}

async function getCoachContext(uid: string): Promise<CoachContext> {
  const [profileSnapshot, roadmapSnapshot, topicsSnapshot, applicationsSnapshot] =
    await Promise.all([
    getDoc(doc(db, "users", uid)),
    getDoc(doc(db, "users", uid, "roadmaps", "active")),
    getDocs(collection(db, "users", uid, "topics")),
    getDocs(collection(db, "users", uid, "applications")),
  ]);

  return {
    profile: profileSnapshot.exists()
      ? (profileSnapshot.data() as UserProfileRecord)
      : null,
    roadmap: roadmapSnapshot.exists()
      ? (roadmapSnapshot.data() as UserRoadmap)
      : null,
    studyTopics: topicsSnapshot.docs.map((document) =>
      normalizeStudyTopic(document.id, document.data() as Record<string, unknown>),
    ),
    applications: applicationsSnapshot.docs
      .map((document) =>
        normalizeApplication(document.id, document.data() as Record<string, unknown>),
      )
      .sort(
        (left, right) =>
          getReferenceDate(right.dateApplied ?? right.updatedAt ?? right.createdAt) -
          getReferenceDate(left.dateApplied ?? left.updatedAt ?? left.createdAt),
      ),
  };
}

function buildCoachContextText(context: CoachContext) {
  const profile = context.profile;
  const roadmap = context.roadmap;
  const studyTopics = context.studyTopics;
  const applications = context.applications;

  const profileLines = profile
    ? [
        `Name: ${profile.name || "Not provided"}`,
        `University: ${profile.university || "Not provided"}`,
        `Degree: ${profile.degree || "Not provided"}`,
        `Graduation Year: ${profile.graduationYear || "Not provided"}`,
        `Target Role: ${profile.targetRole || "Not provided"}`,
        `Current CGPA: ${profile.currentCgpa || "Not provided"}`,
        `Placement Status: ${profile.placementStatus || "Not provided"}`,
      ]
    : ["No onboarding profile found."];

  const roadmapProgress = getRoadmapTaskStats(roadmap);
  const roadmapLines = roadmap
    ? [
        `Active roadmap role: ${roadmap.role}`,
        `Milestones tracked: ${roadmap.milestones.length}`,
        `Roadmap completion: ${roadmapProgress.completionPercentage}%`,
        `Roadmap tasks completed: ${roadmapProgress.completedTasks}/${roadmapProgress.totalTasks}`,
        `Roadmap tasks remaining: ${roadmapProgress.remainingTasks}`,
      ]
    : ["No roadmap saved yet."];

  const completedTopics = studyTopics.filter((topic) => topic.completed).length;
  const estimatedHours = studyTopics.reduce(
    (sum, topic) => sum + topic.estimatedHours,
    0,
  );
  const actualHours = studyTopics.reduce((sum, topic) => sum + topic.actualHours, 0);
  const studyCompletion =
    studyTopics.length === 0 ? 0 : Math.round((completedTopics / studyTopics.length) * 100);
  const studyLines =
    studyTopics.length > 0
      ? [
          `Study topics tracked: ${studyTopics.length}`,
          `Study completion: ${studyCompletion}%`,
          `Study topics completed: ${completedTopics}/${studyTopics.length}`,
          `Estimated study hours: ${estimatedHours}`,
          `Actual study hours: ${actualHours}`,
          `Remaining study topics: ${Math.max(studyTopics.length - completedTopics, 0)}`,
          `Current incomplete study focus: ${
            studyTopics
              .filter((topic) => !topic.completed)
              .slice(0, 5)
              .map((topic) => topic.title)
              .join(", ") || "None"
          }`,
        ]
      : ["No study topics saved yet."];

  const interviewCount = applications.filter(
    (application) =>
      application.status === "Interview" || application.status === "HR Round",
  ).length;
  const offerCount = applications.filter(
    (application) => application.status === "Offer",
  ).length;
  const rejectedCount = applications.filter(
    (application) => application.status === "Rejected",
  ).length;
  const applicationLines =
    applications.length > 0
      ? [
          `Applications tracked: ${applications.length}`,
          `Interview-stage applications: ${interviewCount}`,
          `Offers: ${offerCount}`,
          `Rejected applications: ${rejectedCount}`,
          `Latest applications: ${
            applications
              .slice(0, 5)
              .map(
                (application) =>
                  `${application.company} - ${application.role} (${application.status})`,
              )
              .join("; ")
          }`,
        ]
      : ["No job applications saved yet."];

  return [
    "Student context:",
    "Profile:",
    ...profileLines,
    "Roadmap progress:",
    ...roadmapLines,
    "Study progress:",
    ...studyLines,
    "Job application progress:",
    ...applicationLines,
  ].join("\n");
}

export async function getCoachContextText(uid: string) {
  const context = await getCoachContext(uid);
  return buildCoachContextText(context);
}

function buildGeminiContents(messages: CoachMessage[], contextText: string) {
  const recentMessages = messages.slice(-12);

  return [
    {
      role: "user",
      parts: [
        {
          text: contextText,
        },
      ],
    },
    ...recentMessages.map((message) => ({
      role: message.role,
      parts: [
        {
          text: message.text,
        },
      ],
    })),
  ];
}

function extractGeminiText(response: GeminiResponse) {
  return (
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() || ""
  );
}

export async function generateCoachReply(
  uid: string,
  messages: CoachMessage[],
) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const model = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    throw new Error(
      "Missing VITE_GEMINI_API_KEY. Add your Gemini API key before using AI Coach.",
    );
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: coachSystemInstruction,
            },
          ],
        },
        contents: buildGeminiContents(messages, await getCoachContextText(uid)),
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini request failed with ${response.status}: ${errorText || "Unknown error"}`,
    );
  }

  const data = (await response.json()) as GeminiResponse;
  const text = extractGeminiText(data);

  if (!text) {
    throw new Error("Gemini did not return a readable response.");
  }

  return text;
}
