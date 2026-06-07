import type { RoadmapMilestone, UserRoadmap } from "../types";

interface RoadmapTaskStats {
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  completionPercentage: number;
}

function createTaskStats(totalTasks: number, completedTasks: number): RoadmapTaskStats {
  const remainingTasks = Math.max(totalTasks - completedTasks, 0);

  return {
    totalTasks,
    completedTasks,
    remainingTasks,
    completionPercentage:
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
  };
}

export function getMilestoneTaskStats(
  milestone: Pick<RoadmapMilestone, "tasks">,
): RoadmapTaskStats {
  const totalTasks = milestone.tasks.length;
  const completedTasks = milestone.tasks.filter((task) => task.completed).length;

  return createTaskStats(totalTasks, completedTasks);
}

export function getRoadmapTaskStats(
  roadmap: Pick<UserRoadmap, "milestones"> | null | undefined,
): RoadmapTaskStats {
  const tasks = roadmap?.milestones.flatMap((milestone) => milestone.tasks) ?? [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;

  return createTaskStats(totalTasks, completedTasks);
}
