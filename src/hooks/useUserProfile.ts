import { useEffect, useState } from "react";
import { subscribeToUserProfile } from "../services";
import type { UserProfileRecord } from "../types";

interface UseUserProfileResult {
  profile: UserProfileRecord | null;
  loading: boolean;
  error: string;
}

export function useUserProfile(uid?: string): UseUserProfileResult {
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [loading, setLoading] = useState(Boolean(uid));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uid) {
      return;
    }

    const unsubscribe = subscribeToUserProfile(
      uid,
      (nextProfile) => {
        setProfile(nextProfile);
        setLoading(false);
      },
      (nextError) => {
        setError(nextError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [uid]);

  if (!uid) {
    return { profile: null, loading: false, error: "" };
  }

  return { profile, loading, error };
}
