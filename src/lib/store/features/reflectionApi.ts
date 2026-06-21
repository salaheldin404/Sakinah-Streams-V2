import { HistoryItem, ReflectionResponse } from "@/types/reflection";
import { reflectionApiSlice } from "../services/reflectionSlice";
import { ReflectionRequest } from "@/lib/ai/schemas";


export const reflectionApi = reflectionApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReflections: builder.query<HistoryItem[], void>({
      query: () => `/`,
      transformResponse: (response: HistoryItem[]) => response,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Reflection" as const, id })),
              { type: "Reflection" as const, id: "LIST" },
            ]
          : [{ type: "Reflection" as const, id: "LIST" }],
    }),
    createReflection: builder.mutation<
      ReflectionResponse & { id: string },
      ReflectionRequest
    >({
      query: (data) => ({
        url: "/",
        method: "POST",
        body: data,
      }),
      transformResponse: (response: ReflectionResponse & { id: string }) =>
        response,
      invalidatesTags: [{ type: "Reflection", id: "LIST" }],
    }),
    deleteReflection: builder.mutation({
      query: (id: string) => ({
        url: `/`,
        method: "DELETE",
        body: { id },
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Reflection", id },
        { type: "Reflection", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetReflectionsQuery,
  useCreateReflectionMutation,
  useDeleteReflectionMutation,
} = reflectionApi;
