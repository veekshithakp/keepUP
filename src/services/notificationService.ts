import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
  type Unsubscribe,
} from "firebase/messaging";
import { app, db } from "./firebase";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export async function isPushSupported() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (!("serviceWorker" in navigator)) {
    return false;
  }

  return isSupported();
}

export async function enablePushNotifications(uid: string) {
  const supported = await isPushSupported();

  if (!supported) {
    throw new Error("Push notifications are not supported on this device.");
  }

  if (!VAPID_KEY) {
    throw new Error(
      "Missing VITE_FIREBASE_VAPID_KEY. Add it to your environment variables first.",
    );
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const registration = await navigator.serviceWorker.ready;
  const messaging = getMessaging(app);
  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error("Unable to create a notification token for this device.");
  }

  await setDoc(
    doc(db, "users", uid, "notificationTokens", "web"),
    {
      token,
      platform: "web",
      permission,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return token;
}

export async function subscribeToForegroundNotifications(
  onNotification: (payload: MessagePayload) => void,
) {
  const supported = await isPushSupported();

  if (!supported) {
    return () => undefined;
  }

  const messaging = getMessaging(app);
  const unsubscribe: Unsubscribe = onMessage(messaging, onNotification);
  return unsubscribe;
}
