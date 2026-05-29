import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthCredentialsPayload, AuthState, AuthUser } from "@/types/auth.types";

const initialState: AuthState = {
  user: null,
  accessToken: null,
  role: null,
  status: "idle",
  error: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthLoading: (state) => {
      state.status = "loading";
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<AuthCredentialsPayload>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.role = action.payload.user.role;
      state.status = "authenticated";
      state.error = null;
      state.hydrated = true;
    },
    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      state.role = state.user.role;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.status = state.user ? "authenticated" : "anonymous";
      state.hydrated = true;
    },
    markAuthHydrated: (state) => {
      state.hydrated = true;
      if (state.status === "idle") {
        state.status = state.user ? "authenticated" : "anonymous";
      }
    },
    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.role = null;
      state.status = "anonymous";
      state.error = null;
      state.hydrated = true;
    },
  },
});

export const authActions = authSlice.actions;
export const authReducer = authSlice.reducer;
