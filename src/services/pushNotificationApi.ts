import { auth } from "./firebase";

export interface SelfPushNotificationPayload {
  title: string;
  body: string;
  path?: string;
  type?: string;
}

function canUseBrowserNotifications() {
  return typeof window !== "undefined" && "Notification" in window;
}

async function getServiceWorkerNotificationRegistration() {
  if (!("serviceWorker" in navigator)) {
    return null;
  }

  const existingRegistration = await navigator.serviceWorker.getRegistration();

  if (existingRegistration?.active) {
    return existingRegistration;
  }

  try {
    const readyRegistration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => {
        window.setTimeout(() => resolve(null), 1500);
      }),
    ]);

    return readyRegistration;
  } catch {
    return null;
  }
}

async function showLocalNotification({
  title,
  body,
  path = "/dashboard",
}: SelfPushNotificationPayload) {
  if (!canUseBrowserNotifications() || Notification.permission !== "granted") {
    return false;
  }

  const registration = await getServiceWorkerNotificationRegistration();

  if (registration) {
    try {
      await registration.showNotification(title, {
        body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/badge-72x72.png",
        data: {
          path,
        },
        tag: `keepup-${title.toLowerCase().replace(/\s+/g, "-")}`,
        requireInteraction: true,
      });

      return true;
    } catch {
      // Fall through to the standard Notification API if SW notifications fail.
    }
  }

  const notification = new Notification(title, {
    body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    requireInteraction: true,
  });

  notification.onclick = () => {
    window.focus();
    window.location.assign(path);
  };

  return true;
}

export async function sendSelfPushNotification(
  payload: SelfPushNotificationPayload,
) {
  if (!canUseBrowserNotifications() || Notification.permission !== "granted") {
    return false;
  }

  if (import.meta.env.DEV) {
    return await showLocalNotification(payload);
  }

  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You need to be logged in before sending a notification.");
  }

  const idToken = await currentUser.getIdToken();
  const response = await fetch("/api/notifications/self", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Unable to send the notification right now.");
  }

  return true;
}

export function buildTestNotification(): SelfPushNotificationPayload {
  return {
    title: "KeepUP notifications are live",
    body: "You will now receive push reminders for applications, interviews, and daily study momentum.",
    path: "/dashboard",
    type: "test",
  };
}

export function buildApplicationCreatedNotification(details: {
  company: string;
  role: string;
}): SelfPushNotificationPayload {
  return {
    title: "Application tracked",
    body: `${details.company} - ${details.role} was added to your KeepUP pipeline.`,
    path: "/applications",
    type: "application-created",
  };
}

export function buildApplicationStatusNotification(details: {
  company: string;
  role: string;
  status: string;
}): SelfPushNotificationPayload {
  return {
    title: "Application status updated",
    body: `${details.company} - ${details.role} moved to ${details.status}.`,
    path: "/applications",
    type: "application-status",
  };
}

export function buildRoadmapDeadlineNotification(details: {
  taskTitle: string;
  daysUntil: number;
}): SelfPushNotificationPayload {
  return {
    title: "Roadmap deadline coming up",
    body:
      details.daysUntil <= 0
        ? `${details.taskTitle} is due today. Open KeepUP and finish it.`
        : `${details.taskTitle} is due in ${details.daysUntil} day${details.daysUntil === 1 ? "" : "s"}.`,
    path: "/roadmap",
    type: "roadmap-deadline",
  };
}

export function buildInterviewReminderNotification(details: {
  count: number;
  company: string;
  role: string;
}): SelfPushNotificationPayload {
  return {
    title: "Interview prep reminder",
    body: `You have ${details.count} interview-stage application${details.count === 1 ? "" : "s"}, starting with ${details.company} - ${details.role}.`,
    path: "/applications",
    type: "interview-reminder",
  };
}

export function buildStudyReminderNotification(details: {
  incompleteTopics: number;
  targetRole: string;
}): SelfPushNotificationPayload {
  return {
    title: "Daily study reminder",
    body: `You still have ${details.incompleteTopics} incomplete study topic${details.incompleteTopics === 1 ? "" : "s"} for your ${details.targetRole || "career"} journey.`,
    path: "/roadmap",
    type: "study-reminder",
  };
}

export function buildDailyReminderNotification(targetRole: string) {
  return {
    title: "KeepUP daily reminder",
    body: `Check in on your ${targetRole || "career"} progress and keep your momentum going today.`,
    path: "/dashboard",
    type: "daily-reminder",
  } satisfies SelfPushNotificationPayload;
}

export async function sendTestPushNotification() {
  return sendSelfPushNotification(buildTestNotification());
}

export async function notifyApplicationCreated(details: {
  company: string;
  role: string;
}) {
  return sendSelfPushNotification(buildApplicationCreatedNotification(details));
}

export async function notifyApplicationStatusChanged(details: {
  company: string;
  role: string;
  status: string;
}) {
  return sendSelfPushNotification(buildApplicationStatusNotification(details));
}

export async function sendRoadmapDeadlinePreviewNotification(details: {
  taskTitle: string;
  daysUntil: number;
}) {
  return sendSelfPushNotification(buildRoadmapDeadlineNotification(details));
}

export async function sendInterviewReminderPreviewNotification(details: {
  count: number;
  company: string;
  role: string;
}) {
  return sendSelfPushNotification(buildInterviewReminderNotification(details));
}

export async function sendStudyReminderPreviewNotification(details: {
  incompleteTopics: number;
  targetRole: string;
}) {
  return sendSelfPushNotification(buildStudyReminderNotification(details));
}

export async function sendDailyReminderPreviewNotification(targetRole: string) {
  return sendSelfPushNotification(buildDailyReminderNotification(targetRole));
}
