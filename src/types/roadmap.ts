export type CareerRole = string;

export interface RoadmapTask {
  id: string;
  title: string;
  completed: boolean;
  deadline: string;
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  focus: string;
  tasks: RoadmapTask[];
}

export interface UserRoadmap {
  role: CareerRole;
  milestones: RoadmapMilestone[];
  createdAt?: string | null;
  updatedAt?: string | null;
}
