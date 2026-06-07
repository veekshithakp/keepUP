import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { UserProfileInput, UserProfileRecord } from "../types";

export function createEmptyUserProfile(): UserProfileInput {
  return {
    name: "",
    university: "",
    degree: "",
    graduationYear: "",
    targetRole: "",
    currentCgpa: "",
    placementStatus: "Preparing",
  };
}

function normalizeUserProfile(
  data: UserProfileRecord | null,
): UserProfileRecord | null {
  if (!data) {
    return null;
  }

  return {
    name: data.name ?? "",
    university: data.university ?? "",
    degree: data.degree ?? "",
    graduationYear: data.graduationYear ?? "",
    targetRole: data.targetRole ?? "",
    currentCgpa: data.currentCgpa ?? "",
    placementStatus: data.placementStatus ?? "Preparing",
    email: data.email ?? null,
  };
}

export async function getUserProfile(uid: string) {
  const snapshot = await getDoc(doc(db, "users", uid));

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeUserProfile(snapshot.data() as UserProfileRecord);
}

export function subscribeToUserProfile(
  uid: string,
  onData: (profile: UserProfileRecord | null) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(
    doc(db, "users", uid),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }

      onData(normalizeUserProfile(snapshot.data() as UserProfileRecord));
    },
    (error) => onError(error),
  );
}

export async function saveUserProfile(
  uid: string,
  email: string | null,
  profile: UserProfileInput,
) {
  const existingProfile = await getDoc(doc(db, "users", uid));

  await setDoc(
    doc(db, "users", uid),
    {
      ...profile,
      email,
      updatedAt: serverTimestamp(),
      ...(existingProfile.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  );
}
