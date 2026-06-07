export const applicationStatuses = [
  "Applied",
  "OA",
  "Interview",
  "HR Round",
  "Rejected",
  "Offer",
] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  location: string;
  dateApplied: string;
  status: ApplicationStatus;
  applicationUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateJobApplicationInput {
  company: string;
  role: string;
  location: string;
  dateApplied: string;
  status: ApplicationStatus;
  applicationUrl?: string;
}

export interface AnalyzedJobApplicationLinkResult {
  company: string;
  role: string;
  location: string;
  applicationUrl: string;
  analysisSource: "gemini" | "heuristic";
}

export interface ApplicationStageBreakdownItem {
  status: ApplicationStatus;
  count: number;
}

export interface ApplicationOutcomeBreakdownItem {
  label: string;
  value: number;
  fill: string;
}

export interface ApplicationTrendPoint {
  label: string;
  applications: number;
  interviews: number;
  offers: number;
}

export interface JobApplicationAnalytics {
  applicationsCount: number;
  interviewCount: number;
  offerCount: number;
  rejectionRate: number;
  successRate: number;
  stageBreakdown: ApplicationStageBreakdownItem[];
  outcomeBreakdown: ApplicationOutcomeBreakdownItem[];
  weeklyTrend: ApplicationTrendPoint[];
}
