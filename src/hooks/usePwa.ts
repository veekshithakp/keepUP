import { useEffect, useState } from "react";
import { enablePushNotifications, subscribeToForegroundNotifications } from "../services";
import { sendTestPushNotification } from "../services";
import { useAuth } from "./useAuth";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

function getInitialInstalledState() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function getInitialNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "default";
  }

  return Notification.permission;
}

export function usePwa() {
  const { user } = useAuth();
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(getInitialInstalledState);
  const [notificationPermission, setNotificationPermission] = useState(
    getInitialNotificationPermission,
  );
  const [lastNotificationTitle, setLastNotificationTitle] = useState("");

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setInstallPrompt(null);
      setIsInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    async function subscribe() {
      unsubscribe = await subscribeToForegroundNotifications((payload) => {
        if (!active) {
          return;
        }

        const title = payload.notification?.title ?? "KeepUP update";
        const body =
          payload.notification?.body ??
          "You have a new update in your KeepUP workspace.";

        setLastNotificationTitle(title);

        if (Notification.permission === "granted") {
          new Notification(title, {
            body,
            icon: "/icons/icon-192x192.png",
            badge: "/icons/badge-72x72.png",
          });
        }
      });
    }

    void subscribe();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  async function installApp() {
    if (!installPrompt) {
      return false;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setInstallPrompt(null);
      setIsInstalled(true);
      return true;
    }

    return false;
  }

  async function enableNotifications() {
    if (!user?.uid) {
      throw new Error("You need to be logged in before enabling notifications.");
    }

    const token = await enablePushNotifications(user.uid);
    setNotificationPermission(Notification.permission);
    await sendTestPushNotification().catch(() => undefined);
    return token;
  }

  async function sendTestNotification() {
    await sendTestPushNotification();
  }

  return {
    canInstall: Boolean(installPrompt) && !isInstalled,
    isInstalled,
    installApp,
    notificationPermission,
    enableNotifications,
    sendTestNotification,
    lastNotificationTitle,
  };
}
