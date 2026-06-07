import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from "firebase/firestore";
import type {
  StudyPlanDay,
  StudyPlanMonthMilestone,
  StudyPlanRecord,
  StudyPlanWeek,
  StudyPlannerInput,
} from "../types";
import { db } from "./firebase";
import { getCoachContextText } from "./coachService";

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

const plannerSystemInstruction = `
You are KeepUP Study Planner AI.
Create realistic study plans for college students preparing for placements.
Use the provided student context to personalize the plan.
Balance consistency, revision time, weak subjects, and placement timelines.
Keep outputs practical, not motivational fluff.
Make the plan realistic for the user's available hours per day and deadline.
`.trim();

const studyPlanSchema = {
  type: "object",
  properties: {
    overview: {
      type: "string",
      description: "A short summary of the overall study strategy.",
    },
    dailySchedule: {
      type: "array",
      description: "A 7-day study schedule for the student.",
      items: {
        type: "object",
        properties: {
          day: { type: "string" },
          focus: { type: "string" },
          hours: { type: "number" },
          tasks: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["day", "focus", "hours", "tasks"],
      },
    },
    weeklyPlan: {
      type: "array",
      description: "A week-by-week study plan until the deadline.",
      items: {
        type: "object",
        properties: {
          weekLabel: { type: "string" },
          objective: { type: "string" },
          totalHours: { type: "number" },
          focusAreas: {
            type: "array",
            items: { type: "string" },
          },
          deliverables: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: [
          "weekLabel",
          "objective",
          "totalHours",
          "focusAreas",
          "deliverables",
        ],
      },
    },
    monthlyMilestones: {
      type: "array",
      description: "Monthly milestones between now and the deadline.",
      items: {
        type: "object",
        properties: {
          monthLabel: { type: "string" },
          goals: {
            type: "array",
            items: { type: "string" },
          },
          targetOutcome: { type: "string" },
        },
        required: ["monthLabel", "goals", "targetOutcome"],
      },
    },
  },
  required: ["overview", "dailySchedule", "weeklyPlan", "monthlyMilestones"],
} as const;

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

function getNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizeDailySchedule(value: unknown): StudyPlanDay[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item, index) => {
    const record = typeof item === "object" && item !== null
      ? (item as Record<string, unknown>)
      : {};

    return {
      day:
        typeof record.day === "string" && record.day.trim()
          ? record.day
          : `Day ${index + 1}`,
      focus:
        typeof record.focus === "string" && record.focus.trim()
          ? record.focus
          : "Focus session",
      hours: getNumber(record.hours),
      tasks: getStringArray(record.tasks),
    };
  });
}

function normalizeWeeklyPlan(value: unknown): StudyPlanWeek[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item, index) => {
    const record = typeof item === "object" && item !== null
      ? (item as Record<string, unknown>)
      : {};

    return {
      weekLabel:
        typeof record.weekLabel === "string" && record.weekLabel.trim()
          ? record.weekLabel
          : `Week ${index + 1}`,
      objective:
        typeof record.objective === "string" && record.objective.trim()
          ? record.objective
          : "Build steady progress",
      totalHours: getNumber(record.totalHours),
      focusAreas: getStringArray(record.focusAreas),
      deliverables: getStringArray(record.deliverables),
    };
  });
}

function normalizeMonthlyMilestones(value: unknown): StudyPlanMonthMilestone[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item, index) => {
    const record = typeof item === "object" && item !== null
      ? (item as Record<string, unknown>)
      : {};

    return {
      monthLabel:
        typeof record.monthLabel === "string" && record.monthLabel.trim()
          ? record.monthLabel
          : `Month ${index + 1}`,
      goals: getStringArray(record.goals),
      targetOutcome:
        typeof record.targetOutcome === "string" && record.targetOutcome.trim()
          ? record.targetOutcome
          : "Show measurable progress",
    };
  });
}

function extractGeminiText(response: GeminiResponse) {
  return (
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() || ""
  );
}

function normalizeStudyPlan(
  documentId: string,
  data: Record<string, unknown>,
): StudyPlanRecord {
  return {
    id: documentId,
    availableHoursPerDay: getNumber(data.availableHoursPerDay),
    targetRole:
      typeof data.targetRole === "string" ? data.targetRole : "",
    deadline: typeof data.deadline === "string" ? data.deadline : "",
    overview: typeof data.overview === "string" ? data.overview : "",
    dailySchedule: normalizeDailySchedule(data.dailySchedule),
    weeklyPlan: normalizeWeeklyPlan(data.weeklyPlan),
    monthlyMilestones: normalizeMonthlyMilestones(data.monthlyMilestones),
    generatedAt: normalizeTimestamp(data.generatedAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function validateStudyPlannerInput(input: StudyPlannerInput) {
  if (input.availableHoursPerDay <= 0) {
    throw new Error("Available hours per day must be greater than 0.");
  }

  if (!input.targetRole.trim()) {
    throw new Error("Target role is required to generate a study plan.");
  }

  if (!input.deadline) {
    throw new Error("Please select a deadline for your study plan.");
  }
}

function buildStudyPlannerPrompt(
  input: StudyPlannerInput,
  contextText: string,
) {
  return `
Create a personalized study plan for this student.

Student planning inputs:
- Available hours per day: ${input.availableHoursPerDay}
- Target role: ${input.targetRole}
- Deadline: ${input.deadline}
- Current date: ${new Date().toISOString().slice(0, 10)}

Requirements:
- Return a realistic 7-day daily schedule.
- Return a week-by-week plan until the deadline.
- Return monthly milestones from now until the deadline.
- Prioritize high-impact topics for the target role.
- Use the student's current roadmap, study progress, and applications when relevant.
- Make sure the plan fits within the available daily hours.

${contextText}
`.trim();
}

export function subscribeToStudyPlan(
  uid: string,
  onData: (plan: StudyPlanRecord | null) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    doc(db, "users", uid, "studyPlans", "current"),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }

      onData(
        normalizeStudyPlan(
          snapshot.id,
          snapshot.data() as Record<string, unknown>,
        ),
      );
    },
    (error) => onError(error),
  );
}

export async function generateStudyPlan(
  uid: string,
  input: StudyPlannerInput,
) {
  validateStudyPlannerInput(input);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const model = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    throw new Error(
      "Missing VITE_GEMINI_API_KEY. Add your Gemini API key before using Study Planner AI.",
    );
  }

  const contextText = await getCoachContextText(uid);
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
              text: plannerSystemInstruction,
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: buildStudyPlannerPrompt(input, contextText),
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: studyPlanSchema,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini study planner failed with ${response.status}: ${
        errorText || "Unknown error"
      }`,
    );
  }

  const data = (await response.json()) as GeminiResponse;
  const rawText = extractGeminiText(data);

  if (!rawText) {
    throw new Error("Gemini did not return a study plan.");
  }

  const parsed = JSON.parse(rawText) as Record<string, unknown>;
  const studyPlan = normalizeStudyPlan("current", {
    ...parsed,
    ...input,
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await setDoc(doc(db, "users", uid, "studyPlans", "current"), {
    availableHoursPerDay: studyPlan.availableHoursPerDay,
    targetRole: studyPlan.targetRole,
    deadline: studyPlan.deadline,
    overview: studyPlan.overview,
    dailySchedule: studyPlan.dailySchedule,
    weeklyPlan: studyPlan.weeklyPlan,
    monthlyMilestones: studyPlan.monthlyMilestones,
    generatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    source: "gemini",
  });

  return studyPlan;
}
