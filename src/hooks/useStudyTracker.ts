import { useEffect, useMemo, useState } from "react";
import { subscribeToSubjects, subscribeToTopics } from "../services";
import type {
  StudyProgressEngine,
  StudySubject,
  StudyTopic,
  StudyWeeklyProgressPoint,
} from "../types";

interface UseStudyTrackerResult {
  subjects: StudySubject[];
  topics: StudyTopic[];
  loading: boolean;
  error: string;
  progress: {
    totalTopics: number;
    completedTopics: number;
    completionRate: number;
    estimatedHours: number;
    actualHours: number;
  };
  engine: StudyProgressEngine;
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  }).format(date);
}

export function useStudyTracker(uid: string | undefined): UseStudyTrackerResult {
  const [state, setState] = useState<{
    uid: string | null;
    subjects: StudySubject[];
    topics: StudyTopic[];
    error: string;
    subjectsLoaded: boolean;
    topicsLoaded: boolean;
  }>({
    uid: uid ?? null,
    subjects: [],
    topics: [],
    error: "",
    subjectsLoaded: !uid,
    topicsLoaded: !uid,
  });

  useEffect(() => {
    if (!uid) {
      return;
    }

    const unsubscribeSubjects = subscribeToSubjects(
      uid,
      (nextSubjects) => {
        setState((currentState) => ({
          uid,
          subjects: nextSubjects,
          topics: currentState.uid === uid ? currentState.topics : [],
          error: currentState.uid === uid ? currentState.error : "",
          subjectsLoaded: true,
          topicsLoaded: currentState.uid === uid ? currentState.topicsLoaded : false,
        }));
      },
      (nextError) => {
        setState((currentState) => ({
          uid,
          subjects: currentState.uid === uid ? currentState.subjects : [],
          topics: currentState.uid === uid ? currentState.topics : [],
          error: nextError.message,
          subjectsLoaded: true,
          topicsLoaded: currentState.uid === uid ? currentState.topicsLoaded : false,
        }));
      },
    );

    const unsubscribeTopics = subscribeToTopics(
      uid,
      (nextTopics) => {
        setState((currentState) => ({
          uid,
          subjects: currentState.uid === uid ? currentState.subjects : [],
          topics: nextTopics,
          error: currentState.uid === uid ? currentState.error : "",
          subjectsLoaded: currentState.uid === uid ? currentState.subjectsLoaded : false,
          topicsLoaded: true,
        }));
      },
      (nextError) => {
        setState((currentState) => ({
          uid,
          subjects: currentState.uid === uid ? currentState.subjects : [],
          topics: currentState.uid === uid ? currentState.topics : [],
          error: nextError.message,
          subjectsLoaded: currentState.uid === uid ? currentState.subjectsLoaded : false,
          topicsLoaded: true,
        }));
      },
    );

    return () => {
      unsubscribeSubjects();
      unsubscribeTopics();
    };
  }, [uid]);

  const isCurrentUid = state.uid === uid;
  const subjects = useMemo(
    () => (uid && isCurrentUid ? state.subjects : []),
    [uid, isCurrentUid, state.subjects],
  );
  const topics = useMemo(
    () => (uid && isCurrentUid ? state.topics : []),
    [uid, isCurrentUid, state.topics],
  );
  const error = uid && isCurrentUid ? state.error : "";
  const subjectsLoaded = uid ? (isCurrentUid ? state.subjectsLoaded : false) : true;
  const topicsLoaded = uid ? (isCurrentUid ? state.topicsLoaded : false) : true;

  const progress = useMemo(() => {
    const totalTopics = topics.length;
    const completedTopics = topics.filter((topic) => topic.completed).length;
    const estimatedHours = topics.reduce(
      (sum, topic) => sum + topic.estimatedHours,
      0,
    );
    const actualHours = topics.reduce((sum, topic) => sum + topic.actualHours, 0);
    const completionRate =
      totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

    return {
      totalTopics,
      completedTopics,
      completionRate,
      estimatedHours,
      actualHours,
    };
  }, [topics]);

  const engine = useMemo<StudyProgressEngine>(() => {
    const remainingTopics = Math.max(
      progress.totalTopics - progress.completedTopics,
      0,
    );
    const estimatedTimeLeft = topics.reduce((sum, topic) => {
      if (topic.completed) {
        return sum;
      }

      return sum + Math.max(topic.estimatedHours - topic.actualHours, 0);
    }, 0);

    const subjectProgress = subjects.map((subject) => {
      const subjectTopics = topics.filter((topic) => topic.subjectId === subject.id);
      const completedTopics = subjectTopics.filter((topic) => topic.completed).length;
      const totalTopics = subjectTopics.length;
      const estimatedHours = subjectTopics.reduce(
        (sum, topic) => sum + topic.estimatedHours,
        0,
      );
      const actualHours = subjectTopics.reduce(
        (sum, topic) => sum + topic.actualHours,
        0,
      );

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        totalTopics,
        completedTopics,
        remainingTopics: Math.max(totalTopics - completedTopics, 0),
        completionPercentage:
          totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100),
        estimatedHours,
        actualHours,
        estimatedTimeLeft: subjectTopics.reduce((sum, topic) => {
          if (topic.completed) {
            return sum;
          }

          return sum + Math.max(topic.estimatedHours - topic.actualHours, 0);
        }, 0),
      };
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weeklySeries: StudyWeeklyProgressPoint[] = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - offset);

      weeklySeries.push({
        label: formatDayLabel(day),
        completedTopics: 0,
        actualHours: 0,
      });
    }

    topics.forEach((topic) => {
      const referenceDate = topic.updatedAt ?? topic.createdAt;

      if (!referenceDate) {
        return;
      }

      const topicDate = new Date(referenceDate);

      if (Number.isNaN(topicDate.getTime())) {
        return;
      }

      const matchedPoint = weeklySeries.find((_, index) => {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - (6 - index));

        return isSameDay(targetDate, topicDate);
      });

      if (!matchedPoint) {
        return;
      }

      matchedPoint.actualHours += topic.actualHours;

      if (topic.completed) {
        matchedPoint.completedTopics += 1;
      }
    });

    const topicsUpdatedThisWeek = topics.filter((topic) => {
      const referenceDate = topic.updatedAt ?? topic.createdAt;

      if (!referenceDate) {
        return false;
      }

      const topicDate = new Date(referenceDate);
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);

      return topicDate >= startDate && topicDate <= new Date();
    });

    const weeklyCompleted = topicsUpdatedThisWeek.filter((topic) => topic.completed).length;
    const weeklyProgress =
      topicsUpdatedThisWeek.length === 0
        ? 0
        : Math.round((weeklyCompleted / topicsUpdatedThisWeek.length) * 100);

    return {
      completionPercentage: progress.completionRate,
      remainingTopics,
      estimatedTimeLeft,
      weeklyProgress,
      weeklySeries,
      subjectProgress,
    };
  }, [progress, subjects, topics]);

  return {
    subjects,
    topics,
    loading: !subjectsLoaded || !topicsLoaded,
    error,
    progress,
    engine,
  };
}
