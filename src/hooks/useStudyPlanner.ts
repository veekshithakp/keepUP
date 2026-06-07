import { useEffect, useState } from "react";
import { subscribeToStudyPlan } from "../services";
import type { StudyPlanRecord } from "../types";

interface UseStudyPlannerResult {
  plan: StudyPlanRecord | null;
  loading: boolean;
  error: string;
}

export function useStudyPlanner(uid: string | undefined): UseStudyPlannerResult {
  const [state, setState] = useState<{
    uid: string | null;
    plan: StudyPlanRecord | null;
    loading: boolean;
    error: string;
  }>({
    uid: uid ?? null,
    plan: null,
    loading: Boolean(uid),
    error: "",
  });

  useEffect(() => {
    if (!uid) {
      return;
    }

    return subscribeToStudyPlan(
      uid,
      (nextPlan) => {
        setState({
          uid,
          plan: nextPlan,
          loading: false,
          error: "",
        });
      },
      (nextError) => {
        setState({
          uid,
          plan: null,
          loading: false,
          error: nextError.message,
        });
      },
    );
  }, [uid]);

  const isCurrentUid = state.uid === uid;

  return {
    plan: uid && isCurrentUid ? state.plan : null,
    loading: uid ? (isCurrentUid ? state.loading : true) : false,
    error: uid && isCurrentUid ? state.error : "",
  };
}
