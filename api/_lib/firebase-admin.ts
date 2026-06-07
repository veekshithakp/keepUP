import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

function getServerEnvValue(key: string) {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing server environment variable: ${key}`);
  }

  return value;
}

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  return initializeApp({
    credential: cert({
      projectId:
        process.env.FIREBASE_ADMIN_PROJECT_ID ??
        process.env.FIREBASE_PROJECT_ID ??
        process.env.VITE_FIREBASE_PROJECT_ID ??
        getServerEnvValue("FIREBASE_ADMIN_PROJECT_ID"),
      clientEmail: getServerEnvValue("FIREBASE_ADMIN_CLIENT_EMAIL"),
      privateKey: getServerEnvValue("FIREBASE_ADMIN_PRIVATE_KEY").replace(
        /\\n/g,
        "\n",
      ),
    }),
  });
}

const adminApp = getAdminApp();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminMessaging = getMessaging(adminApp);
