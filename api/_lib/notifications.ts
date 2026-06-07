import type { DocumentReference } from "firebase-admin/firestore";
import { getAdminDb, getAdminMessaging } from "./firebase-admin.js";

interface PushToUserPayload {
  title: string;
  body: string;
  path?: string;
  type?: string;
}

function toStringRecord(input: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(input).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  );
}

export async function sendPushToUser(uid: string, payload: PushToUserPayload) {
  const adminDb = getAdminDb();
  const adminMessaging = getAdminMessaging();

  const tokensSnapshot = await adminDb
    .collection("users")
    .doc(uid)
    .collection("notificationTokens")
    .get();

  const tokenEntries = tokensSnapshot.docs
    .map((document) => {
      const data = document.data();

      return {
        ref: document.ref,
        token: typeof data.token === "string" ? data.token : null,
      };
    })
    .filter(
      (
        entry,
      ): entry is { ref: DocumentReference; token: string } => Boolean(entry.token),
    );

  if (tokenEntries.length === 0) {
    return 0;
  }

  const response = await adminMessaging.sendEachForMulticast({
    tokens: tokenEntries.map((entry) => entry.token),
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: toStringRecord({
      path: payload.path ?? "/dashboard",
      type: payload.type,
    }),
    webpush: {
      notification: {
        icon: "/icons/icon-192x192.png",
        badge: "/icons/badge-72x72.png",
      },
    },
  });

  const staleTokenDeletes = response.responses.flatMap((result, index) => {
    if (result.success) {
      return [];
    }

    const code = result.error?.code;

    if (
      code === "messaging/registration-token-not-registered" ||
      code === "messaging/invalid-registration-token"
    ) {
      return [tokenEntries[index]?.ref.delete()];
    }

    return [];
  });

  if (staleTokenDeletes.length > 0) {
    await Promise.all(staleTokenDeletes);
  }

  return response.successCount;
}
