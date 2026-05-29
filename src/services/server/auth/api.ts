import { baseApi } from "@/services/server/baseApi";
import { authActions } from "@/redux/auth/authSlice";
import type { ApiEnvelope } from "@/types/api.types";
import type {
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  ResendVerificationRequest,
  ResetPasswordRequest,
  SignupRequest,
  VerifyEmailRequest,
  AuthUser,
} from "@/types/auth.types";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<AuthResponse>) => response.data,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(authActions.setCredentials(data));
        } catch {
          // The caller owns displaying the auth error.
        }
      },
      invalidatesTags: ["Auth", "User"],
    }),

    signup: builder.mutation<AuthResponse, SignupRequest>({
      query: (body) => ({
        url: "/auth/signup",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<AuthResponse>) => response.data,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.requiresEmailVerification === false) {
            dispatch(authActions.setCredentials(data));
          }
        } catch {
          // The caller owns displaying the auth error.
        }
      },
      invalidatesTags: ["Auth", "User"],
    }),

    refreshSession: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: "/auth/refresh-token",
        method: "POST",
      }),
      transformResponse: (response: ApiEnvelope<AuthResponse>) => response.data,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(authActions.setCredentials(data));
        } catch {
          dispatch(authActions.clearCredentials());
        }
      },
      invalidatesTags: ["Auth", "User"],
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(authActions.clearCredentials());
          dispatch(baseApi.util.resetApiState());
        }
      },
      invalidatesTags: ["Auth", "User"],
    }),

    me: builder.query<AuthUser, void>({
      query: () => "/auth/me",
      transformResponse: (response: ApiEnvelope<{ user: AuthUser }>) => response.data.user,
      providesTags: ["Auth", "User"],
    }),

    forgotPassword: builder.mutation<ApiEnvelope<void>, ForgotPasswordRequest>({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),

    resetPassword: builder.mutation<ApiEnvelope<void>, ResetPasswordRequest>({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
    }),

    changePassword: builder.mutation<ApiEnvelope<void>, ChangePasswordRequest>({
      query: (body) => ({
        url: "/auth/password",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    verifyEmail: builder.mutation<ApiEnvelope<void>, VerifyEmailRequest>({
      query: (body) => ({
        url: "/auth/verify-email",
        method: "POST",
        body,
      }),
    }),

    resendVerification: builder.mutation<ApiEnvelope<void>, ResendVerificationRequest>({
      query: (body) => ({
        url: "/auth/resend-verification",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useRefreshSessionMutation,
  useLogoutMutation,
  useMeQuery,
  useLazyMeQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
} = authApi;
