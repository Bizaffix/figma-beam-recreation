import { baseApi } from "@/services/server/baseApi";
import type { ApiEnvelope } from "@/types/api.types";

export type UploadBucket =
  | "retreat-images"
  | "retreat-location-images"
  | "retreat-project-images"
  | "retreat-patterns"
  | "venue-images"
  | "listing-images"
  | "email-images"
  | "profile-images";

export const uploadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadFile: builder.mutation<string, { bucket: UploadBucket; file: File }>({
      query: ({ bucket, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return { url: `/uploads/${bucket}/single`, method: "POST", body: formData };
      },
      transformResponse: (response: ApiEnvelope<{ url: string }>) => response.data.url,
    }),

    uploadFiles: builder.mutation<string[], { bucket: UploadBucket; files: File[] }>({
      query: ({ bucket, files }) => {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        return { url: `/uploads/${bucket}/multiple`, method: "POST", body: formData };
      },
      transformResponse: (response: ApiEnvelope<{ files: { url: string }[] }>) =>
        (response.data.files ?? []).map((f) => f.url).filter(Boolean),
    }),
  }),
});

export const { useUploadFileMutation, useUploadFilesMutation } = uploadApi;
