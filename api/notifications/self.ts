import { sendPushToUser } from "../_lib/notifications.js";
import {
  getMissingFirebaseAdminEnvVars,
} from "../_lib/firebase-admin.js";
import { verifyAuthenticatedUser } from "../_lib/verify-user.js";

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return new Response("Method not allowed.", { status: 405 });
  }

  try {
    const missingFirebaseAdminEnvVars = getMissingFirebaseAdminEnvVars();

    if (missingFirebaseAdminEnvVars.length > 0) {
      return Response.json(
        {
          ok: false,
          error:
            "Firebase Admin server environment variables are missing.",
          missing: missingFirebaseAdminEnvVars,
        },
        { status: 500 },
      );
    }

    const decodedToken = await verifyAuthenticatedUser(request);
    const body = (await request.json()) as {
      title?: string;
      body?: string;
      path?: string;
      type?: string;
    };

    if (!body.title?.trim() || !body.body?.trim()) {
      return Response.json(
        {
          ok: false,
          error: "Missing notification title or body.",
        },
        { status: 400 },
      );
    }

    const delivered = await sendPushToUser(decodedToken.uid, {
      title: body.title.trim(),
      body: body.body.trim(),
      path: body.path?.trim() || "/dashboard",
      type: body.type?.trim(),
    });

    if (delivered === 0) {
      return Response.json(
        {
          ok: false,
          error:
            "No valid push notification token was found for this account. Re-enable notifications and try again.",
        },
        { status: 409 },
      );
    }

    return Response.json({
      ok: true,
      delivered,
    });
  } catch (error) {
    console.error("self-notification failed", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      hasAuthorizationHeader: Boolean(request.headers.get("authorization")),
    });

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to send notification.",
      },
      { status: 500 },
    );
  }
}
