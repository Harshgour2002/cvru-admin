import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { normalizePage, unwrapData } from "@/lib/api/utils";
import { EventItem } from "@/types/api";

const key = ["events"];

export function useEvents(page: number, size = 10) {
  return useQuery({
    queryKey: [...key, page, size],
    queryFn: async () => {
      const response = await apiClient.get(endpoints.events.upcoming, { params: { page, size } });
      return normalizePage<EventItem>(unwrapData(response.data));
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: EventItem) => apiClient.post(endpoints.events.base, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: EventItem }) => apiClient.put(`${endpoints.events.base}/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => apiClient.delete(`${endpoints.events.base}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
