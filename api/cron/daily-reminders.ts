import { getAdminDb } from "../_lib/firebase-admin.js";
import { sendPushToUser } from "../_lib/notifications.js";

interface RoadmapTaskRecord {
  title?: string;
  completed?: boolean;
  deadline?: string;
}

interface RoadmapMilestoneRecord {
  tasks?: RoadmapTaskRecord[];
}

interface ApplicationRecord {
  company?: string;
  role?: string;
  status?: string;
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDaysUntil(dateString: string) {
  const now = new Date();
  const target = new Date(dateString);

  if (Number.isNaN(target.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function buildReminderPayload(input: {
  targetRole?: string;
  milestones: RoadmapMilestoneRecord[];
  applications: ApplicationRecord[];
  incompleteTopics: number;
}) {
  const upcomingTasks = input.milestones.flatMap((milestone) =>
    (milestone.tasks ?? []).filter((task) => {
      if (task.completed || !task.deadline) {
        return false;
      }

      const daysUntil = getDaysUntil(task.deadline);
      return daysUntil >= 0 && daysUntil <= 2;
    }),
  );

  if (upcomingTasks.length > 0) {
    const task = upcomingTasks[0];
    const daysUntil = task.deadline ? getDaysUntil(task.deadline) : 0;

    return {
      title: "Roadmap deadline coming up",
      body:
        daysUntil <= 0
          ? `${task.title ?? "A roadmap task"} is due today. Open KeepUP and finish it.`
          : `${task.title ?? "A roadmap task"} is due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}.`,
      path: "/roadmap",
      type: "roadmap-deadline",
    };
  }

  const interviewStageApplications = input.applications.filter(
    (application) =>
      application.status === "Interview" || application.status === "HR Round",
  );

  if (interviewStageApplications.length > 0) {
    const application = interviewStageApplications[0];

    return {
      title: "Interview prep reminder",
      body: `You have ${interviewStageApplications.length} interview-stage application${interviewStageApplications.length === 1 ? "" : "s"}, starting with ${application.company ?? "a company"} - ${application.role ?? "your role"}.`,
      path: "/applications",
      type: "interview-reminder",
    };
  }

  if (input.incompleteTopics > 0) {
    return {
      title: "Daily study reminder",
      body: `You still have ${input.incompleteTopics} incomplete study topic${input.incompleteTopics === 1 ? "" : "s"} for your ${input.targetRole || "career"} journey.`,
      path: "/roadmap",
      type: "study-reminder",
    };
  }

  return {
    title: "KeepUP daily reminder",
    body: `Check in on your ${input.targetRole || "career"} progress and keep your momentum going today.`,
    path: "/dashboard",
    type: "daily-reminder",
  };
}

export default async function handler(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (expectedSecret && authorization !== `Bearer ${expectedSecret}`) {
    return new Response("Unauthorized.", { status: 401 });
  }

  try {
    const adminDb = getAdminDb();
    const usersSnapshot = await adminDb.collection("users").get();
    const todayKey = getTodayKey();
    let notifiedUsers = 0;

    for (const userDocument of usersSnapshot.docs) {
      const uid = userDocument.id;
      const userData = userDocument.data() as { targetRole?: string };

      const [
        tokensSnapshot,
        roadmapSnapshot,
        topicsSnapshot,
        applicationsSnapshot,
        metaSnapshot,
      ] = await Promise.all([
        adminDb
          .collection("users")
          .doc(uid)
          .collection("notificationTokens")
          .get(),
        adminDb.collection("users").doc(uid).collection("roadmaps").doc("active").get(),
        adminDb.collection("users").doc(uid).collection("topics").get(),
        adminDb.collection("users").doc(uid).collection("applications").get(),
        adminDb
          .collection("users")
          .doc(uid)
          .collection("notificationMeta")
          .doc("daily-reminder")
          .get(),
      ]);

      if (tokensSnapshot.empty) {
        continue;
      }

      if (metaSnapshot.exists && metaSnapshot.data().lastSentOn === todayKey) {
        continue;
      }

      const milestones = roadmapSnapshot.exists
        ? ((roadmapSnapshot.data().milestones as RoadmapMilestoneRecord[]) ?? [])
        : [];
      const applications = applicationsSnapshot.docs.map(
        (document) => document.data() as ApplicationRecord,
      );
      const incompleteTopics = topicsSnapshot.docs.filter(
        (document) => document.data().completed !== true,
      ).length;

      const payload = buildReminderPayload({
        targetRole: userData.targetRole,
        milestones,
        applications,
        incompleteTopics,
      });
      const delivered = await sendPushToUser(uid, payload);

      if (delivered > 0) {
        notifiedUsers += 1;
        await adminDb
          .collection("users")
          .doc(uid)
          .collection("notificationMeta")
          .doc("daily-reminder")
          .set({
            lastSentOn: todayKey,
            updatedAt: new Date().toISOString(),
            lastType: payload.type,
          });
      }
    }

    return Response.json({
      ok: true,
      notifiedUsers,
      date: todayKey,
    });
  } catch (error) {
    console.error("daily-reminders failed", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return Response.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to run daily reminder notifications.",
      },
      { status: 500 },
    );
  }
}
