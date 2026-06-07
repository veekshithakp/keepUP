import type { UserProfileInput } from "./userProfile";

export interface UserProfileRecord extends UserProfileInput {
  email?: string | null;
}

export interface RecommendationItem {
  id: string;
  title: string;
  message: string;
}

export interface DashboardMetric {
  value: string;
  detail: string;
}

export interface PlacementReadinessFactor {
  id:
    | "dsa"
    | "core-subjects"
    | "projects"
    | "resume"
    | "applications"
    | "interview-performance";
  label: string;
  score: number;
  weight: number;
  detail: string;
  recommendation: string;
}

export interface PlacementReadinessEngine {
  overallScore: number;
  factors: PlacementReadinessFactor[];
  weaknesses: string[];
  recommendations: string[];
}

export interface AnalyticsMetric extends DashboardMetric {
  rawValue: number;
}

export interface AnalyticsTrendPoint {
  label: string;
  studyHours: number;
  topicsCompleted: number;
  applicationsSubmitted: number;
  interviewsScheduled: number;
}

export interface DashboardAnalytics {
  totalStudyHours: AnalyticsMetric;
  topicsCompleted: AnalyticsMetric;
  applicationsSubmitted: AnalyticsMetric;
  interviewsScheduled: AnalyticsMetric;
  roadmapCompletion: AnalyticsMetric;
  readinessScore: AnalyticsMetric;
  trend: AnalyticsTrendPoint[];
}

export interface DashboardData {
  profile: UserProfileRecord | null;
  studyProgress: DashboardMetric;
  jobApplications: DashboardMetric;
  placementReadiness: DashboardMetric;
  readinessEngine: PlacementReadinessEngine;
  dailyGoals: DashboardMetric;
  weeklyProgress: DashboardMetric;
  analytics: DashboardAnalytics;
  recommendations: RecommendationItem[];
}
