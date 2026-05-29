import { baseApi } from "@/services/server/baseApi";
import type { ApiEnvelope } from "@/types/api.types";

type FavoriteRecord = {
  id: string;
  retreatId: string;
  retreat?: Record<string, unknown>;
};

export const favoriteApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFavorites: builder.query<FavoriteRecord[], void>({
      query: () => "/favorites",
      transformResponse: (response: ApiEnvelope<{ favorites: FavoriteRecord[] }>) =>
        response.data.favorites ?? [],
      providesTags: [{ type: "Favorite", id: "LIST" }],
    }),

    addFavorite: builder.mutation<unknown, string>({
      query: (retreatId) => ({ url: `/favorites/${retreatId}`, method: "POST" }),
      invalidatesTags: [{ type: "Favorite", id: "LIST" }],
    }),

    removeFavorite: builder.mutation<unknown, string>({
      query: (retreatId) => ({ url: `/favorites/${retreatId}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Favorite", id: "LIST" }],
    }),
  }),
});

export const {
  useGetFavoritesQuery,
  useLazyGetFavoritesQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} = favoriteApi;
