import { baseApi } from "@/redux/api/baseApi";

const payrollApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPayments: builder.query<any, string | void>({
      query: (params = "") => `/payments${params ? `?${params}` : ""}`,
      providesTags: ["payments"],
    }),
    createPayment: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({ url: "/payments", method: "POST", body }),
      invalidatesTags: ["payments", "workers", "budget"],
    }),
    deletePayment: builder.mutation<any, string>({
      query: (id) => ({ url: `/payments/${id}`, method: "DELETE" }),
      invalidatesTags: ["payments", "workers", "budget"],
    }),
    getWorkerEarnings: builder.query<
      any,
      { workerId: string; from?: string; to?: string }
    >({
      query: ({ workerId, from, to }) =>
        `/workers/${workerId}/earnings?${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString()}`,
      providesTags: (_result, _error, { workerId }) => [
        { type: "payments", id: workerId },
      ],
    }),
    listLeaves: builder.query<any, string | void>({
      query: (params = "") => `/leaves${params ? `?${params}` : ""}`,
      providesTags: ["leave"],
    }),
    createLeave: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({ url: "/leaves", method: "POST", body }),
      invalidatesTags: ["leave"],
    }),
    reviewLeave: builder.mutation<
      any,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/leaves/${id}/review`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["leave"],
    }),
    createWithdraw: builder.mutation<
      any,
      { workerId: string; amount: number }
    >({
      query: ({ workerId, amount }) => ({
        url: `/workers/${workerId}/withdraws`,
        method: "POST",
        body: { amount },
      }),
      invalidatesTags: ["withdraws", "payments", "workers"],
    }),
    getWorkerWithdraws: builder.query<
      any,
      { workerId: string; params?: string }
    >({
      query: ({ workerId, params = "" }) =>
        `/workers/${workerId}/withdraws${params ? `?${params}` : ""}`,
      providesTags: ["withdraws"],
    }),
    listAllWithdraws: builder.query<any, string | void>({
      query: (params = "") =>
        `/workers/withdraws/all${params ? `?${params}` : ""}`,
      providesTags: ["withdraws"],
    }),
    reviewWithdraw: builder.mutation<
      any,
      {
        workerId: string;
        withdrawId: string;
        body: { status: "Accepted" | "Rejected"; note?: string };
      }
    >({
      query: ({ workerId, withdrawId, body }) => ({
        url: `/workers/${workerId}/withdraws/${withdrawId}/review`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["withdraws", "payments", "workers"],
    }),
    getStripeConnectStatus: builder.query<any, string>({
      query: (workerId) => `/workers/${workerId}/stripe-connect/status`,
      providesTags: ["withdraws"],
    }),
    getStripeOnboardingLink: builder.mutation<any, string>({
      query: (workerId) => ({
        url: `/workers/${workerId}/stripe-connect/onboard`,
        method: "POST",
      }),
      invalidatesTags: ["withdraws"],
    }),
  }),
});

export const {
  useListPaymentsQuery,
  useCreatePaymentMutation,
  useDeletePaymentMutation,
  useGetWorkerEarningsQuery,
  useListLeavesQuery,
  useCreateLeaveMutation,
  useReviewLeaveMutation,
  useCreateWithdrawMutation,
  useGetWorkerWithdrawsQuery,
  useListAllWithdrawsQuery,
  useReviewWithdrawMutation,
  useGetStripeConnectStatusQuery,
  useGetStripeOnboardingLinkMutation,
} = payrollApi;

