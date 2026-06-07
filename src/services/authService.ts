import { type FirebaseError } from "firebase/app";
import type { AuthAction } from "../types";

export function getAuthErrorMessage(
  error: unknown,
  action: AuthAction,
): string {
  if (!isFirebaseError(error)) {
    return action === "login"
      ? "Unable to log in right now. Please try again."
      : "Unable to create your account right now. Please try again.";
  }

  switch (error.code) {
    case "auth/invalid-credential":
      return "Invalid email or password. If this account is new, create it first from the signup page.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
      return "No account was found for this email. Create an account first.";
    case "auth/wrong-password":
      return "The password is incorrect. Please try again.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try logging in instead.";
    case "auth/weak-password":
      return "Password should be at least 6 characters long.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a bit and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your internet connection and try again.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled in your Firebase project yet.";
    default:
      return error.message || "Something went wrong. Please try again.";
  }
}

function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as FirebaseError).code === "string"
  );
}
