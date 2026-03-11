import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { normalizePage, unwrapData } from "@/lib/api/utils";
import { CourseItem } from "@/types/api";

const key = ["courses"];

export function useCourses() {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const response = await apiClient.get(endpoints.courses.base);
      return normalizePage<CourseItem>(unwrapData(response.data));
    },
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async (payload: CourseItem) => apiClient.post(endpoints.courses.base, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: key }) });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async ({ id, payload }: { id: number; payload: CourseItem }) => apiClient.put(`${endpoints.courses.base}/${id}`, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: key }) });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async (id: number) => apiClient.delete(`${endpoints.courses.base}/${id}`), onSuccess: () => queryClient.invalidateQueries({ queryKey: key }) });
}
