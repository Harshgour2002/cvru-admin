import { ApiEnvelope, PageResponse } from "@/types/api";

export function unwrapData<T>(payload: ApiEnvelope<T> | T): T {
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
}

export function normalizePage<T>(payload: unknown): PageResponse<T> {
  const data = payload as Record<string, unknown>;

  if (Array.isArray(data.content)) {
    return {
      content: data.content as T[],
      page: (data.page as number | undefined) ?? (data.number as number | undefined),
      size: data.size as number | undefined,
      totalElements: data.totalElements as number | undefined,
      totalPages: data.totalPages as number | undefined,
      number: data.number as number | undefined,
    };
  }

  if (Array.isArray(payload)) {
    return { content: payload as T[] };
  }

  return { content: [] };
}
