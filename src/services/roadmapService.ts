import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { createRoadmapFromRole } from "../data";
import { db } from "./firebase";
import type {
  CareerRole,
  RoadmapMilestone,
  RoadmapTask,
  UserRoadmap,
} from "../types";

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

function normalizeTask(task: unknown): RoadmapTask | null {
  if (typeof task !== "object" || task === null) {
    return null;
  }

  const record = task as Record<string, unknown>;

  return {
    id: typeof record.id === "string" ? record.id : crypto.randomUUID(),
    title: typeof record.title === "string" ? record.title : "Untitled Task",
    completed: record.completed === true,
    deadline: typeof record.deadline === "string" ? record.deadline : "",
  };
}

function normalizeMilestone(milestone: unknown): RoadmapMilestone | null {
  if (typeof milestone !== "object" || milestone === null) {
    return null;
  }

  const record = milestone as Record<string, unknown>;
  const tasks = Array.isArray(record.tasks)
    ? record.tasks.map(normalizeTask).filter((task): task is RoadmapTask => task !== null)
    : [];

  return {
    id:
      typeof record.id === "string"
        ? record.id
        : typeof record.title === "string"
          ? record.title.toLowerCase().replace(/\s+/g, "-")
          : crypto.randomUUID(),
    title:
      typeof record.title === "string" ? record.title : "Untitled Milestone",
    focus: typeof record.focus === "string" ? record.focus : "",
    tasks,
  };
}

function normalizeMilestones(value: unknown): RoadmapMilestone[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeMilestone)
    .filter((milestone): milestone is RoadmapMilestone => milestone !== null);
}

export function subscribeToUserRoadmap(
  uid: string,
  onData: (roadmap: UserRoadmap | null) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    doc(db, "users", uid, "roadmaps", "active"),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }

      const data = snapshot.data();

      onData({
        role: data.role as CareerRole,
        milestones: normalizeMilestones(data.milestones),
        createdAt: normalizeTimestamp(data.createdAt),
        updatedAt: normalizeTimestamp(data.updatedAt),
      });
    },
    (error) => onError(error),
  );
}

export async function generateAndSaveRoadmap(uid: string, role: CareerRole) {
  const today = new Date();
  const milestones = createRoadmapFromRole(role).map((milestone, milestoneIndex) => ({
    ...milestone,
    tasks: milestone.tasks.map((task, taskIndex) => {
      const deadline = new Date(today);
      deadline.setDate(today.getDate() + milestoneIndex * 14 + taskIndex * 5 + 7);

      return {
        ...task,
        completed: false,
        deadline: deadline.toISOString(),
      };
    }),
  }));

  await setDoc(
    doc(db, "users", uid, "roadmaps", "active"),
    {
      role: role.trim(),
      milestones,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function updateRoadmapTaskStatus(
  uid: string,
  roadmap: UserRoadmap,
  milestoneId: string,
  taskId: string,
  completed: boolean,
) {
  const milestones = roadmap.milestones.map((milestone) => {
    if (milestone.id !== milestoneId) {
      return milestone;
    }

    return {
      ...milestone,
      tasks: milestone.tasks.map((task) =>
        task.id === taskId ? { ...task, completed } : task,
      ),
    };
  });

  await updateDoc(doc(db, "users", uid, "roadmaps", "active"), {
    milestones,
    updatedAt: serverTimestamp(),
  });
}
