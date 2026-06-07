export type PlacementStatus =
  | "Not Started"
  | "Preparing"
  | "Actively Applying"
  | "Placed";

export interface UserProfileInput {
  name: string;
  university: string;
  degree: string;
  graduationYear: string;
  targetRole: string;
  currentCgpa: string;
  placementStatus: PlacementStatus;
}
