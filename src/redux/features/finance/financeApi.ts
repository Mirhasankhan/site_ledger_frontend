import { baseApi } from "@/redux/api/baseApi";

const financeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listExpenses: builder.query<any, string | void>({
      query: (params = "") => `/expenses${params ? `?${params}` : ""}`,
      providesTags: ["expenses"],
    }),

    createExpense: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({ url: "/expenses", method: "POST", body }),
      invalidatesTags: ["expenses", "budget"],
    }),

    reviewExpense: builder.mutation<
      any,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/expenses/${id}/review`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["expenses", "budget"],
    }),

    updateExpense: builder.mutation<
      any,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/expenses/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["expenses", "budget"],
    }),

    deleteExpense: builder.mutation<any, string>({
      query: (id) => ({ url: `/expenses/${id}`, method: "DELETE" }),
      invalidatesTags: ["expenses", "budget"],
    }),
    listMaterials: builder.query<any, string | void>({
      query: (params = "") => `/materials${params ? `?${params}` : ""}`,
      providesTags: ["materials"],
    }),

    createMaterial: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({ url: "/materials", method: "POST", body }),
      invalidatesTags: ["materials"],
    }),

    updateMaterial: builder.mutation<
      any,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/materials/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["materials"],
    }),

    createMaterialPurchase: builder.mutation<
      any,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/materials/${id}/purchases`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["materials"],
    }),

    createMaterialUsage: builder.mutation<
      any,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/materials/${id}/usages`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["materials", "budget"],
    }),

    listMaterialRequests: builder.query<any, string | void>({
      query: (params = "") =>
        `/materials/requests${params ? `?${params}` : ""}`,
      providesTags: ["materials"],
    }),

    createMaterialRequest: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({ url: "/materials/requests", method: "POST", body }),
      invalidatesTags: ["materials"],
    }),

    reviewMaterialRequest: builder.mutation<
      any,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/materials/requests/${id}/review`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["materials"],
    }),
  }),
});

export const {
  useListExpensesQuery,
  useCreateExpenseMutation,
  useReviewExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
  useListMaterialsQuery,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useCreateMaterialPurchaseMutation,
  useCreateMaterialUsageMutation,
  useListMaterialRequestsQuery,
  useCreateMaterialRequestMutation,
  useReviewMaterialRequestMutation,
} = financeApi;
