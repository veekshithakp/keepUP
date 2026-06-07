export interface TailoredResumeRecord {
  targetJobTitle: string;
  jobDescription: string;
  matchSummary: string;
  tailoredProfessionalSummary: string;
  tailoredSkills: string[];
  rewrittenProjectBullets: string[];
  missingKeywords: string[];
  recommendations: string[];
  updatedAt?: string | null;
}

export interface ResumeAnalysisRecord {
  id: string;
  fileName: string;
  targetRole: string;
  summary: string;
  atsScore: number;
  score: number;
  projects: string[];
  skills: string[];
  missingSections: string[];
  recommendations: string[];
  strengths: string[];
  tailoredResume?: TailoredResumeRecord | null;
  analyzedAt?: string | null;
  updatedAt?: string | null;
}
