import { baseApi } from "@/services/server/baseApi";
import type { ApiEnvelope } from "@/types/api.types";

export type UserProfile = {
  id: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  website?: string | null;
  socialMedia?: Record<string, string> | null;
  propertyName?: string | null;
  aiSubscriptionStatus?: string;
};

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserProfile: builder.query<UserProfile | null, void>({
      query: () => "/users/profile",
      transformResponse: (response: ApiEnvelope<{ user: UserProfile }>) => response.data.user ?? null,
      providesTags: ["User"],
    }),

    updateUserProfile: builder.mutation<UserProfile, Partial<UserProfile>>({
      query: (body) => ({ url: "/users/profile", method: "PATCH", body }),
      transformResponse: (response: ApiEnvelope<{ user: UserProfile }>) => response.data.user,
      invalidatesTags: ["User", "Auth"],
    }),

    uploadUserAvatar: builder.mutation<string, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("avatar", file);
        return { url: "/users/avatar", method: "POST", body: formData };
      },
      transformResponse: (response: ApiEnvelope<{ avatarUrl: string }>) => response.data.avatarUrl,
      invalidatesTags: ["User", "Auth"],
    }),

    markFirstEventFreeUsed: builder.mutation<UserProfile, void>({
      query: () => ({ url: "/users/profile", method: "PATCH", body: { firstEventFreeUsed: true } }),
      transformResponse: (response: ApiEnvelope<{ user: UserProfile }>) => response.data.user,
      invalidatesTags: ["User", "Auth"],
    }),
  }),
});

export const {
  useGetUserProfileQuery,
  useLazyGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useUploadUserAvatarMutation,
  useMarkFirstEventFreeUsedMutation,
} = userApi;
