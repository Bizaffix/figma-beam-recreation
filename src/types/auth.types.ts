export type BackendUserRole = "student" | "instructor" | "location_owner" | "admin";
export type AppUserRole = BackendUserRole | "venue-owner";

export type AiSubscriptionStatus =
  | "inactive"
  | "active"
  | "past_due"
  | "canceled"
  | null;

export interface AuthUser {
  id: string;
  email: string;
  role: BackendUserRole;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  emailVerified?: boolean;
  aiSubscriptionStatus?: AiSubscriptionStatus;
  referralCode?: string | null;
  user_metadata?: {
    first_name?: string | null;
    last_name?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
    [key: string]: unknown;
  };
  app_metadata?: Record<string, unknown>;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  role: BackendUserRole | null;
  status: "idle" | "loading" | "authenticated" | "anonymous";
  error: string | null;
  hydrated: boolean;
}

export interface AuthCredentialsPayload {
  user: AuthUser;
  accessToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  role?: Exclude<BackendUserRole, "admin">;
  firstName?: string;
  lastName?: string;
  bio?: string;
  propertyName?: string;
  referralCode?: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  requiresEmailVerification?: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export const normalizeRole = (role: AppUserRole | null | undefined): BackendUserRole | null => {
  if (!role) return null;
  return role === "venue-owner" ? "location_owner" : role;
};
