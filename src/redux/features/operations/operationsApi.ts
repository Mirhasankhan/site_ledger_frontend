import { baseApi } from "@/redux/api/baseApi";

const operationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAttendance: builder.query<any, string | void>({
      query: (params = "") => `/attendances${params ? `?${params}` : ""}`,
      providesTags: ["attendance"],
    }),
    markAttendanceBulk: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({ url: "/attendances/bulk", method: "POST", body }),
      invalidatesTags: ["attendance"],
    }),
    selfCheckIn: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({
        url: "/attendances/self-checkin",
        method: "POST",
        body,
      }),
      invalidatesTags: ["attendance"],
    }),
    verifyAttendance: builder.mutation<
      any,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/attendances/${id}/verify`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["attendance"],
    }),
    listDailyReports: builder.query<any, string | void>({
      query: (params = "") => `/daily-reports${params ? `?${params}` : ""}`,
      providesTags: ["reports"],
    }),
    createDailyReport: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({ url: "/daily-reports", method: "POST", body }),
      invalidatesTags: ["reports"],
    }),
    updateDailyReport: builder.mutation<
      any,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/daily-reports/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["reports"],
    }),
    deleteDailyReport: builder.mutation<any, string>({
      query: (id) => ({ url: `/daily-reports/${id}`, method: "DELETE" }),
      invalidatesTags: ["reports"],
    }),
  }),
});

export const {
  useListAttendanceQuery,
  useMarkAttendanceBulkMutation,
  useSelfCheckInMutation,
  useVerifyAttendanceMutation,
  useListDailyReportsQuery,
  useCreateDailyReportMutation,
  useUpdateDailyReportMutation,
  useDeleteDailyReportMutation,
} = operationsApi;
