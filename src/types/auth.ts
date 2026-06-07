import type { User } from "firebase/auth";
import type { ReactNode } from "react";

export type AuthAction = "login" | "signup";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup(email: string, password: string): Promise<void>;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

export interface AuthProviderProps {
  children: ReactNode;
}
