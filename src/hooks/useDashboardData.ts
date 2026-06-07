import { useEffect, useState } from "react";
import { subscribeToDashboardData } from "../services";
import type { DashboardData } from "../types";

interface UseDashboardDataResult {
  data: DashboardData | null;
  loading: boolean;
  error: string;
}

export function useDashboardData(uid: string | undefined): UseDashboardDataResult {
  const [state, setState] = useState<{
    uid: string | null;
    data: DashboardData | null;
    loading: boolean;
    error: string;
  }>({
    uid: uid ?? null,
    data: null,
    loading: Boolean(uid),
    error: "",
  });

  useEffect(() => {
    if (!uid) {
      return;
    }

    return subscribeToDashboardData(
      uid,
      (nextData) => {
        setState({
          uid,
          data: nextData,
          loading: false,
          error: "",
        });
      },
      (err) => {
        setState({
          uid,
          data: null,
          loading: false,
          error:
            err instanceof Error
              ? err.message
              : "Unable to load dashboard data right now.",
        });
      },
    );
  }, [uid]);

  const isCurrentUid = state.uid === uid;

  return {
    data: uid && isCurrentUid ? state.data : null,
    loading: uid ? (isCurrentUid ? state.loading : true) : false,
    error: uid && isCurrentUid ? state.error : "",
  };
}
