import { useEffect, useState } from "react";
import { subscribeToUserRoadmap } from "../services";
import type { UserRoadmap } from "../types";

interface UseUserRoadmapResult {
  roadmap: UserRoadmap | null;
  loading: boolean;
  error: string;
}

export function useUserRoadmap(uid: string | undefined): UseUserRoadmapResult {
  const [state, setState] = useState<{
    uid: string | null;
    roadmap: UserRoadmap | null;
    loading: boolean;
    error: string;
  }>({
    uid: uid ?? null,
    roadmap: null,
    loading: Boolean(uid),
    error: "",
  });

  useEffect(() => {
    if (!uid) {
      return;
    }

    const unsubscribe = subscribeToUserRoadmap(
      uid,
      (nextRoadmap) => {
        setState({
          uid,
          roadmap: nextRoadmap,
          loading: false,
          error: "",
        });
      },
      (nextError) => {
        setState({
          uid,
          roadmap: null,
          loading: false,
          error: nextError.message,
        });
      },
    );

    return unsubscribe;
  }, [uid]);

  const isCurrentUid = state.uid === uid;

  return {
    roadmap: uid && isCurrentUid ? state.roadmap : null,
    loading: uid ? (isCurrentUid ? state.loading : true) : false,
    error: uid && isCurrentUid ? state.error : "",
  };
}
