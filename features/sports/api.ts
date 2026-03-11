import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { normalizePage, unwrapData } from "@/lib/api/utils";
import { SportItem } from "@/types/api";

const key = ["sports"];

export function useSports() {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const response = await apiClient.get(endpoints.sports.base);
      return normalizePage<SportItem>(unwrapData(response.data));
    },
  });
}

export function useCreateSport() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async (payload: SportItem) => apiClient.post(endpoints.sports.base, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: key }) });
}

export function useUpdateSport() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async ({ id, payload }: { id: number; payload: SportItem }) => apiClient.put(`${endpoints.sports.base}/${id}`, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: key }) });
}

export function useDeleteSport() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async (id: number) => apiClient.delete(`${endpoints.sports.base}/${id}`), onSuccess: () => queryClient.invalidateQueries({ queryKey: key }) });
}
