import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

function getRequiredEnvValue(key: keyof ImportMetaEnv) {
  const value = import.meta.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

const firebaseConfig = {
  apiKey: getRequiredEnvValue("VITE_FIREBASE_API_KEY"),
  authDomain: getRequiredEnvValue("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getRequiredEnvValue("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getRequiredEnvValue("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getRequiredEnvValue("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getRequiredEnvValue("VITE_FIREBASE_APP_ID"),
};

export const app = initializeApp(firebaseConfig);

let dbInstance: Firestore;

try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
} catch {
  dbInstance = getFirestore(app);
}

export const auth = getAuth(app);
export const db = dbInstance;
