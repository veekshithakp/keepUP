import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

const REQUIRED_FIREBASE_ADMIN_ENV_KEYS = [
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
] as const;

function getServerEnvValue(key: string) {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`Missing server environment variable: ${key}`);
  }

  return value;
}

function normalizePrivateKey(value: string) {
  const trimmedValue = value.trim();
  const unwrappedValue = trimmedValue.replace(/^['"]|['"]$/g, "");
  return unwrappedValue.replace(/\\n/g, "\n");
}

export function getMissingFirebaseAdminEnvVars() {
  return REQUIRED_FIREBASE_ADMIN_ENV_KEYS.filter(
    (key) => !process.env[key]?.trim(),
  );
}

function getAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  const missingEnvVars = getMissingFirebaseAdminEnvVars();

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Firebase Admin is not configured. Missing server environment variable${missingEnvVars.length === 1 ? "" : "s"}: ${missingEnvVars.join(", ")}.`,
    );
  }

  try {
    return initializeApp({
      credential: cert({
        projectId:
          process.env.FIREBASE_ADMIN_PROJECT_ID ??
          process.env.FIREBASE_PROJECT_ID ??
          process.env.VITE_FIREBASE_PROJECT_ID ??
          getServerEnvValue("FIREBASE_ADMIN_PROJECT_ID"),
        clientEmail: getServerEnvValue("FIREBASE_ADMIN_CLIENT_EMAIL"),
        privateKey: normalizePrivateKey(
          getServerEnvValue("FIREBASE_ADMIN_PRIVATE_KEY"),
        ),
      }),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Firebase Admin error.";
    throw new Error(`Firebase Admin initialization failed: ${message}`, {
      cause: error,
    });
  }
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminMessaging() {
  return getMessaging(getAdminApp());
}
