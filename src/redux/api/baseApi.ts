import { JWTDecode } from "@/utils/jwt";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000/api/v1",
    prepareHeaders: (headers) => {
      const { token } = JWTDecode();

      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: [
    "users",
    "projects",
    "workers",
    "rates",
    "tasks",
    "attendance",
    "reports",
    "expenses",
    "materials",
    "budget",
    "payments",
    "leave",
    "chat",
    "activity",
    "invites",
    "withdraws",
  ],
  endpoints: () => ({}),
});
