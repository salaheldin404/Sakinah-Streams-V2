import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: "/api/ai/reflection",
});


export const reflectionApiSlice = createApi({
  reducerPath: "reflectionApi",
  baseQuery,
  endpoints: () => ({}),
  tagTypes: ["Reflection"],
});