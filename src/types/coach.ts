export type CoachMessageRole = "user" | "model";

export interface CoachMessage {
  id: string;
  role: CoachMessageRole;
  text: string;
  createdAt?: string | null;
  localCreatedAt: string;
}

export interface CreateCoachMessageInput {
  role: CoachMessageRole;
  text: string;
}

export interface CoachSuggestion {
  id: string;
  title: string;
  prompt: string;
}
