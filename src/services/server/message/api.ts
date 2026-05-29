import { baseApi } from "@/services/server/baseApi";
import type { ApiEnvelope, QueryParams } from "@/types/api.types";
import { toParams } from "@/services/server/utils";

export type Conversation = Record<string, unknown>;
export type Message = Record<string, unknown>;

export const messageApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query<Conversation[], QueryParams | void>({
      query: (params) => ({
        url: "/messages/conversations",
        params: toParams(params ?? undefined),
      }),
      transformResponse: (response: ApiEnvelope<{ conversations: Conversation[] }>) =>
        response.data.conversations ?? [],
      providesTags: [{ type: "Message", id: "LIST" }],
    }),

    getConversation: builder.query<
      { conversation: Conversation; messages: Message[] },
      string
    >({
      query: (id) => `/messages/conversations/${id}`,
      transformResponse: (response: ApiEnvelope<{ conversation: Conversation; messages: Message[] }>) =>
        response.data,
      providesTags: (_r, _e, id) => [{ type: "Message", id }],
    }),

    startConversation: builder.mutation<Conversation, Record<string, unknown>>({
      query: (body) => ({ url: "/messages/conversations", method: "POST", body }),
      transformResponse: (response: ApiEnvelope<{ conversation: Conversation }>) => response.data.conversation,
      invalidatesTags: [{ type: "Message", id: "LIST" }],
    }),

    sendMessage: builder.mutation<Message, { conversationId: string; body: Record<string, unknown> }>({
      query: ({ conversationId, body }) => ({
        url: `/messages/conversations/${conversationId}`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<{ message: Message }>) => response.data.message,
      invalidatesTags: (_r, _e, { conversationId }) => [
        { type: "Message", id: conversationId },
        { type: "Message", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useLazyGetConversationsQuery,
  useGetConversationQuery,
  useLazyGetConversationQuery,
  useStartConversationMutation,
  useSendMessageMutation,
} = messageApi;

// Backward-compatible hook names
export const useGetMessageThreadsQuery = useGetConversationsQuery;
export const useGetMessageThreadByIdQuery = useGetConversationQuery;
