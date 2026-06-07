import { useEffect, useState } from "react";
import { subscribeToCoachMessages } from "../services";
import type { CoachMessage } from "../types";

interface UseCoachChatResult {
  messages: CoachMessage[];
  loading: boolean;
  error: string;
}

export function useCoachChat(uid: string | undefined): UseCoachChatResult {
  const [state, setState] = useState<{
    uid: string | null;
    messages: CoachMessage[];
    loading: boolean;
    error: string;
  }>({
    uid: uid ?? null,
    messages: [],
    loading: Boolean(uid),
    error: "",
  });

  useEffect(() => {
    if (!uid) {
      return;
    }

    return subscribeToCoachMessages(
      uid,
      (nextMessages) => {
        setState({
          uid,
          messages: nextMessages,
          loading: false,
          error: "",
        });
      },
      (nextError) => {
        setState({
          uid,
          messages: [],
          loading: false,
          error: nextError.message,
        });
      },
    );
  }, [uid]);

  const isCurrentUid = state.uid === uid;

  return {
    messages: uid && isCurrentUid ? state.messages : [],
    loading: uid ? (isCurrentUid ? state.loading : true) : false,
    error: uid && isCurrentUid ? state.error : "",
  };
}
