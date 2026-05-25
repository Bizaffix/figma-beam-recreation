import type { AuthState } from "@/types/auth.types";

type AuthRootState = {
  auth: AuthState;
};

export const selectAuth = (state: AuthRootState) => state.auth;
export const selectAuthUser = (state: AuthRootState) => state.auth.user;
export const selectAccessToken = (state: AuthRootState) => state.auth.accessToken;
export const selectAuthRole = (state: AuthRootState) => state.auth.role;
export const selectAuthStatus = (state: AuthRootState) => state.auth.status;
export const selectAuthError = (state: AuthRootState) => state.auth.error;
export const selectAuthHydrated = (state: AuthRootState) => state.auth.hydrated;
export const selectIsAuthenticated = (state: AuthRootState) =>
  Boolean(state.auth.user && state.auth.accessToken);
export const selectHasAiAccess = (state: AuthRootState) =>
  state.auth.user?.aiSubscriptionStatus === "active";
