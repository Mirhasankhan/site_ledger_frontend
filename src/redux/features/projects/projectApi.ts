import { baseApi } from "@/redux/api/baseApi";

const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listProjects: builder.query<any, string | void>({
      query: (params = "") => `/projects${params ? `?${params}` : ""}`,
      providesTags: ["projects"],
    }),
    getProject: builder.query<any, string>({
      query: (id) => `/projects/${id}`,
      providesTags: (_result, _error, id) => [{ type: "projects", id }],
    }),
    getBudgetSummary: builder.query<any, string>({
      query: (id) => `/projects/${id}/budget-summary`,
      providesTags: (_result, _error, id) => [{ type: "budget", id }],
    }),
    createProject: builder.mutation<any, FormData | Record<string, unknown>>({
      query: (body) => ({ url: "/projects", method: "POST", body }),
      invalidatesTags: ["projects"],
    }),
    updateProject: builder.mutation<
      any,
      { id: string; body: FormData | Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/projects/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["projects"],
    }),
    listSiteManagers: builder.query<any, void>({
      query: () => "/projects/site-managers",
      providesTags: ["users"],
    }),
    deleteProject: builder.mutation<any, string>({
      query: (id) => ({ url: `/projects/${id}`, method: "DELETE" }),
      invalidatesTags: ["projects"],
    }),
    getProjectRates: builder.query<
      any,
      { projectId: string; active?: boolean }
    >({
      query: ({ projectId, active = true }) =>
        `/projects/${projectId}/rates?active=${active}`,
      providesTags: (_result, _error, { projectId }) => [
        { type: "rates", id: projectId },
      ],
    }),
    createProjectRate: builder.mutation<
      any,
      { projectId: string; body: Record<string, unknown> }
    >({
      query: ({ projectId, body }) => ({
        url: `/projects/${projectId}/rates`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "rates", id: projectId },
      ],
    }),
    listWorkers: builder.query<any, string | void>({
      query: (params = "") => `/workers${params ? `?${params}` : ""}`,
      providesTags: ["workers"],
    }),
    assignWorker: builder.mutation<
      any,
      {
        workerId: string;
        body: { projectId: string; overrideDailyRate?: number };
      }
    >({
      query: ({ workerId, body }) => ({
        url: `/workers/${workerId}/assign`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["workers", "projects"],
    }),
    unassignWorker: builder.mutation<any, string>({
      query: (workerId) => ({
        url: `/workers/${workerId}/unassign`,
        method: "POST",
      }),
      invalidatesTags: ["workers", "projects"],
    }),
    listTasks: builder.query<any, string | void>({
      query: (params = "") => `/tasks${params ? `?${params}` : ""}`,
      providesTags: ["tasks"],
    }),
    createTask: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({ url: "/tasks", method: "POST", body }),
      invalidatesTags: ["tasks"],
    }),
    updateTask: builder.mutation<
      any,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({ url: `/tasks/${id}`, method: "PATCH", body }),
      invalidatesTags: ["tasks"],
    }),
    deleteTask: builder.mutation<any, string>({
      query: (id) => ({ url: `/tasks/${id}`, method: "DELETE" }),
      invalidatesTags: ["tasks"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListProjectsQuery,
  useGetProjectQuery,
  useGetBudgetSummaryQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useListSiteManagersQuery,
  useGetProjectRatesQuery,
  useCreateProjectRateMutation,
  useListWorkersQuery,
  useAssignWorkerMutation,
  useUnassignWorkerMutation,
  useListTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = projectApi;
