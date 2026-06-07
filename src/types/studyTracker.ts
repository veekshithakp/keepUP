export interface StudySubject {
  id: string;
  name: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface StudyTopic {
  id: string;
  subjectId: string;
  title: string;
  notes: string;
  resources: string[];
  estimatedHours: number;
  actualHours: number;
  completed: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface StudyWeeklyProgressPoint {
  label: string;
  completedTopics: number;
  actualHours: number;
}

export interface StudySubjectProgress {
  subjectId: string;
  subjectName: string;
  totalTopics: number;
  completedTopics: number;
  remainingTopics: number;
  completionPercentage: number;
  estimatedHours: number;
  actualHours: number;
  estimatedTimeLeft: number;
}

export interface StudyProgressEngine {
  completionPercentage: number;
  remainingTopics: number;
  estimatedTimeLeft: number;
  weeklyProgress: number;
  weeklySeries: StudyWeeklyProgressPoint[];
  subjectProgress: StudySubjectProgress[];
}

export interface CreateSubjectInput {
  name: string;
}

export interface CreateTopicInput {
  subjectId: string;
  title: string;
  notes: string;
  resources: string[];
  estimatedHours: number;
  actualHours: number;
}

export interface UpdateTopicInput {
  title?: string;
  notes?: string;
  resources?: string[];
  estimatedHours?: number;
  actualHours?: number;
  completed?: boolean;
}
