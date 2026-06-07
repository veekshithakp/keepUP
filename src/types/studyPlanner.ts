export interface StudyPlannerInput {
  availableHoursPerDay: number;
  targetRole: string;
  deadline: string;
}

export interface StudyPlanDay {
  day: string;
  focus: string;
  hours: number;
  tasks: string[];
}

export interface StudyPlanWeek {
  weekLabel: string;
  objective: string;
  totalHours: number;
  focusAreas: string[];
  deliverables: string[];
}

export interface StudyPlanMonthMilestone {
  monthLabel: string;
  goals: string[];
  targetOutcome: string;
}

export interface StudyPlanRecord extends StudyPlannerInput {
  id: string;
  overview: string;
  dailySchedule: StudyPlanDay[];
  weeklyPlan: StudyPlanWeek[];
  monthlyMilestones: StudyPlanMonthMilestone[];
  generatedAt?: string | null;
  updatedAt?: string | null;
}
