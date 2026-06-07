import { adminAuth } from "./firebase-admin";

export async function verifyAuthenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Missing Firebase auth token.");
  }

  const idToken = authorization.slice("Bearer ".length).trim();

  if (!idToken) {
    throw new Error("Missing Firebase auth token.");
  }

  return adminAuth.verifyIdToken(idToken);
}
