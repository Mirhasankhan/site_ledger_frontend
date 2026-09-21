import { baseApi } from "../../api/baseApi";

export interface InviteItem {
  id: string;
  email: string;
  role: "ADMIN" | "SITE_MANAGER" | "WORKER";
  workerCategory?: string | null;
  token: string;
  status: "Pending" | "Accepted" | "Expired" | "Cancelled";
  expiresAt: string;
  createdAt: string;
}

export interface CreateInvitePayload {
  email: string;
  role: "ADMIN" | "SITE_MANAGER" | "WORKER";
  workerCategory?: string;
}

const inviteApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createInvite: builder.mutation<
      { message: string; data: InviteItem },
      CreateInvitePayload
    >({
      query: (body) => ({
        url: "/invites",
        method: "POST",
        body,
      }),
      invalidatesTags: ["invites"],
    }),
    fetchAllInvites: builder.query<
      {
        message: string;
        data: InviteItem[];
        pagination?: { total: number; page: number; limit: number; totalPages: number };
      },
      string | void
    >({
      query: (params = "") => `/invites${params ? `?${params}` : ""}`,
      providesTags: ["invites"],
    }),
    fetchSingleInvite: builder.query<
      { message: string; data: InviteItem },
      string
    >({
      query: (id) => `/invites/${id}`,
      providesTags: ["invites"],
    }),
    deleteInvite: builder.mutation<{ message: string; data: { id: string } }, string>({
      query: (id) => ({
        url: `/invites/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["invites"],
    }),
  }),
});

export const {
  useCreateInviteMutation,
  useFetchAllInvitesQuery,
  useFetchSingleInviteQuery,
  useDeleteInviteMutation,
} = inviteApi;
