import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  CreateSubjectInput,
  CreateTopicInput,
  StudySubject,
  StudyTopic,
  UpdateTopicInput,
} from "../types";

function normalizeStringArray(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

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

function mapSubject(documentId: string, data: Record<string, unknown>): StudySubject {
  return {
    id: documentId,
    name: typeof data.name === "string" ? data.name : "Untitled Subject",
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

function mapTopic(documentId: string, data: Record<string, unknown>): StudyTopic {
  return {
    id: documentId,
    subjectId: typeof data.subjectId === "string" ? data.subjectId : "",
    title: typeof data.title === "string" ? data.title : "Untitled Topic",
    notes: typeof data.notes === "string" ? data.notes : "",
    resources: Array.isArray(data.resources)
      ? data.resources.filter((value): value is string => typeof value === "string")
      : [],
    estimatedHours: Number(data.estimatedHours) || 0,
    actualHours: Number(data.actualHours) || 0,
    completed: data.completed === true,
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
  };
}

export function subscribeToSubjects(
  uid: string,
  onData: (subjects: StudySubject[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    collection(db, "users", uid, "subjects"),
    (snapshot) => {
      const subjects = snapshot.docs
        .map((document) =>
          mapSubject(document.id, document.data() as Record<string, unknown>),
        )
        .sort((left, right) => left.name.localeCompare(right.name));

      onData(subjects);
    },
    (error) => onError(error),
  );
}

export function subscribeToTopics(
  uid: string,
  onData: (topics: StudyTopic[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    collection(db, "users", uid, "topics"),
    (snapshot) => {
      const topics = snapshot.docs
        .map((document) =>
          mapTopic(document.id, document.data() as Record<string, unknown>),
        )
        .sort((left, right) => left.title.localeCompare(right.title));

      onData(topics);
    },
    (error) => onError(error),
  );
}

export async function createSubject(uid: string, input: CreateSubjectInput) {
  await addDoc(collection(db, "users", uid, "subjects"), {
    name: input.name.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function createTopic(uid: string, input: CreateTopicInput) {
  await addDoc(collection(db, "users", uid, "topics"), {
    subjectId: input.subjectId,
    title: input.title.trim(),
    notes: input.notes.trim(),
    resources: normalizeStringArray(input.resources),
    estimatedHours: input.estimatedHours,
    actualHours: input.actualHours,
    completed: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTopic(
  uid: string,
  topicId: string,
  input: UpdateTopicInput,
) {
  const updates: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (typeof input.title === "string") {
    updates.title = input.title.trim();
  }

  if (typeof input.notes === "string") {
    updates.notes = input.notes.trim();
  }

  if (Array.isArray(input.resources)) {
    updates.resources = normalizeStringArray(input.resources);
  }

  if (typeof input.estimatedHours === "number") {
    updates.estimatedHours = input.estimatedHours;
  }

  if (typeof input.actualHours === "number") {
    updates.actualHours = input.actualHours;
  }

  if (typeof input.completed === "boolean") {
    updates.completed = input.completed;
  }

  await updateDoc(doc(db, "users", uid, "topics", topicId), updates);
}

export async function toggleTopicComplete(
  uid: string,
  topicId: string,
  completed: boolean,
) {
  await updateTopic(uid, topicId, { completed });
}
