import { useEffect, useState } from "react";
import { subscribeToResumeAnalysis } from "../services";
import type { ResumeAnalysisRecord } from "../types";

interface UseResumeAnalysisResult {
  analysis: ResumeAnalysisRecord | null;
  loading: boolean;
  error: string;
}

export function useResumeAnalysis(
  uid: string | undefined,
): UseResumeAnalysisResult {
  const [state, setState] = useState<{
    uid: string | null;
    analysis: ResumeAnalysisRecord | null;
    loading: boolean;
    error: string;
  }>({
    uid: uid ?? null,
    analysis: null,
    loading: Boolean(uid),
    error: "",
  });

  useEffect(() => {
    if (!uid) {
      return;
    }

    return subscribeToResumeAnalysis(
      uid,
      (nextAnalysis) => {
        setState({
          uid,
          analysis: nextAnalysis,
          loading: false,
          error: "",
        });
      },
      (nextError) => {
        setState({
          uid,
          analysis: null,
          loading: false,
          error: nextError.message,
        });
      },
    );
  }, [uid]);

  const isCurrentUid = state.uid === uid;

  return {
    analysis: uid && isCurrentUid ? state.analysis : null,
    loading: uid ? (isCurrentUid ? state.loading : true) : false,
    error: uid && isCurrentUid ? state.error : "",
  };
}
