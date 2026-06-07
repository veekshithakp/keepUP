import { useEffect, useMemo, useState } from "react";
import { subscribeToApplications } from "../services";
import type {
  ApplicationStatus,
  JobApplication,
  JobApplicationAnalytics,
} from "../types";
import { applicationStatuses } from "../types";

interface UseApplicationsResult {
  applications: JobApplication[];
  groupedApplications: Record<ApplicationStatus, JobApplication[]>;
  analytics: JobApplicationAnalytics;
  loading: boolean;
  error: string;
  totals: {
    total: number;
    active: number;
    offers: number;
    rejected: number;
  };
}

function parseApplicationDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
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

export function useApplications(uid: string | undefined): UseApplicationsResult {
  const [state, setState] = useState<{
    uid: string | null;
    applications: JobApplication[];
    loading: boolean;
    error: string;
  }>({
    uid: uid ?? null,
    applications: [],
    loading: Boolean(uid),
    error: "",
  });

  useEffect(() => {
    if (!uid) {
      return;
    }

    return subscribeToApplications(
      uid,
      (nextApplications) => {
        setState({
          uid,
          applications: nextApplications,
          loading: false,
          error: "",
        });
      },
      (nextError) => {
        setState({
          uid,
          applications: [],
          loading: false,
          error: nextError.message,
        });
      },
    );
  }, [uid]);

  const isCurrentUid = state.uid === uid;
  const applications = useMemo(
    () => (uid && isCurrentUid ? state.applications : []),
    [uid, isCurrentUid, state.applications],
  );
  const loading = uid ? (isCurrentUid ? state.loading : true) : false;
  const error = uid && isCurrentUid ? state.error : "";

  const groupedApplications = useMemo(
    () =>
      applicationStatuses.reduce<Record<ApplicationStatus, JobApplication[]>>(
        (groups, status) => {
          groups[status] = applications.filter(
            (application) => application.status === status,
          );
          return groups;
        },
        {
          Applied: [],
          OA: [],
          Interview: [],
          "HR Round": [],
          Rejected: [],
          Offer: [],
        },
      ),
    [applications],
  );

  const totals = useMemo(() => {
    const offers = groupedApplications.Offer.length;
    const rejected = groupedApplications.Rejected.length;

    return {
      total: applications.length,
      active: Math.max(applications.length - offers - rejected, 0),
      offers,
      rejected,
    };
  }, [applications.length, groupedApplications]);

  const analytics = useMemo<JobApplicationAnalytics>(() => {
    const interviewCount =
      groupedApplications.Interview.length + groupedApplications["HR Round"].length;
    const offerCount = groupedApplications.Offer.length;
    const rejectionCount = groupedApplications.Rejected.length;
    const applicationsCount = applications.length;
    const rejectionRate =
      applicationsCount === 0
        ? 0
        : Math.round((rejectionCount / applicationsCount) * 100);
    const successRate =
      applicationsCount === 0
        ? 0
        : Math.round((offerCount / applicationsCount) * 100);

    const stageBreakdown = applicationStatuses.map((status) => ({
      status,
      count: groupedApplications[status].length,
    }));

    const outcomeBreakdown = [
      {
        label: "Offers",
        value: offerCount,
        fill: "#f7f3eb",
      },
      {
        label: "Rejected",
        value: rejectionCount,
        fill: "#8f877d",
      },
      {
        label: "Active",
        value: Math.max(applicationsCount - offerCount - rejectionCount, 0),
        fill: "#d9cebf",
      },
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weeklyTrend: JobApplicationAnalytics["weeklyTrend"] = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - offset);

      weeklyTrend.push({
        label: formatDayLabel(day),
        applications: 0,
        interviews: 0,
        offers: 0,
      });
    }

    applications.forEach((application) => {
      const referenceDate = parseApplicationDate(
        application.dateApplied ?? application.updatedAt ?? application.createdAt,
      );

      if (!referenceDate) {
        return;
      }

      const matchedPoint = weeklyTrend.find((_, index) => {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - (6 - index));

        return isSameDay(targetDate, referenceDate);
      });

      if (!matchedPoint) {
        return;
      }

      matchedPoint.applications += 1;

      if (
        application.status === "Interview" ||
        application.status === "HR Round"
      ) {
        matchedPoint.interviews += 1;
      }

      if (application.status === "Offer") {
        matchedPoint.offers += 1;
      }
    });

    return {
      applicationsCount,
      interviewCount,
      offerCount,
      rejectionRate,
      successRate,
      stageBreakdown,
      outcomeBreakdown,
      weeklyTrend,
    };
  }, [applications, groupedApplications]);

  return {
    applications,
    groupedApplications,
    analytics,
    loading,
    error,
    totals,
  };
}
