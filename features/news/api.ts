import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { normalizePage, unwrapData } from "@/lib/api/utils";
import { NewsItem } from "@/types/api";

const key = ["news"];

export function useNews(page: number, size = 10) {
  return useQuery({
    queryKey: [...key, page, size],
    queryFn: async () => {
      const response = await apiClient.get(endpoints.news.base, { params: { page, size } });
      return normalizePage<NewsItem>(unwrapData(response.data));
    },
  });
}

export function useCreateNews() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async (payload: NewsItem) => apiClient.post(endpoints.news.base, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: key }) });
}

export function useUpdateNews() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async ({ id, payload }: { id: number; payload: NewsItem }) => apiClient.put(`${endpoints.news.base}/${id}`, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: key }) });
}

export function useDeleteNews() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: async (id: number) => apiClient.delete(`${endpoints.news.base}/${id}`), onSuccess: () => queryClient.invalidateQueries({ queryKey: key }) });
}
