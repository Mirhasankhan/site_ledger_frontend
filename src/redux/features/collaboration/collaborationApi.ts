import { baseApi } from "@/redux/api/baseApi";

const collaborationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRooms: builder.query<any, void>({
      query: () => "/chat/rooms",
      providesTags: ["chat"],
    }),
    createRoom: builder.mutation<any, { receiverId: string }>({
      query: (body) => ({ url: "/chat/rooms", method: "POST", body }),
      invalidatesTags: ["chat"],
    }),

    getRoomMessages: builder.query<any, { roomId: string; page?: number }>({
      query: ({ roomId, page = 1 }) =>
        `/chat/rooms/${roomId}/messages?page=${page}&limit=50`,
      providesTags: (_result, _error, { roomId }) => [
        { type: "chat", id: roomId },
      ],
    }),

    sendDirectMessage: builder.mutation<
      any,
      { roomId: string; body: { content?: string; fileUrl?: string[] } }
    >({
      query: ({ roomId, body }) => ({
        url: `/chat/rooms/${roomId}/messages`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { roomId }) => [
        { type: "chat", id: roomId },
      ],
    }),

    getProjectMessages: builder.query<
      any,
      { projectId: string; page?: number }
    >({
      query: ({ projectId, page = 1 }) =>
        `/chat/project-rooms/${projectId}/messages?page=${page}&limit=50`,
      providesTags: (_result, _error, { projectId }) => [
        { type: "chat", id: projectId },
      ],
    }),

    sendProjectMessage: builder.mutation<
      any,
      { projectId: string; body: { content?: string; fileUrl?: string[] } }
    >({
      query: ({ projectId, body }) => ({
        url: `/chat/project-rooms/${projectId}/messages`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "chat", id: projectId },
      ],
    }),
    
    getGlobalActivity: builder.query<any, string | void>({
      query: (params = "") => `/activity${params ? `?${params}` : ""}`,
      providesTags: ["activity"],
    }),
    getProjectActivity: builder.query<
      any,
      { projectId: string; params?: string }
    >({
      query: ({ projectId, params = "" }) =>
        `/projects/${projectId}/activity${params ? `?${params}` : ""}`,
      providesTags: (_result, _error, { projectId }) => [
        { type: "activity", id: projectId },
      ],
    }),
  }),
});

export const {
  useGetRoomsQuery,
  useCreateRoomMutation,
  useGetRoomMessagesQuery,
  useSendDirectMessageMutation,
  useGetProjectMessagesQuery,
  useSendProjectMessageMutation,
  useGetGlobalActivityQuery,
  useGetProjectActivityQuery,
} = collaborationApi;
