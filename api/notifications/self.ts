import { sendPushToUser } from "../_lib/notifications";
import { verifyAuthenticatedUser } from "../_lib/verify-user";

export default async function handler(request: Request) {
  if (request.method !== "POST") {
    return new Response("Method not allowed.", { status: 405 });
  }

  try {
    const decodedToken = await verifyAuthenticatedUser(request);
    const body = (await request.json()) as {
      title?: string;
      body?: string;
      path?: string;
      type?: string;
    };

    if (!body.title?.trim() || !body.body?.trim()) {
      return new Response("Missing notification title or body.", { status: 400 });
    }

    const delivered = await sendPushToUser(decodedToken.uid, {
      title: body.title.trim(),
      body: body.body.trim(),
      path: body.path?.trim() || "/dashboard",
      type: body.type?.trim(),
    });

    return Response.json({
      ok: true,
      delivered,
    });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Unable to send notification.",
      { status: 500 },
    );
  }
}
