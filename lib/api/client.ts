"use client";

import { clearSession, getAccessToken } from "@/lib/auth/session";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type RequestConfig = {
  params?: Record<string, string | number>;
  headers?: Record<string, string>;
  _baseOverride?: string;
};

const configuredBaseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const defaultApiBaseUrl = "http://localhost:8080";

function normalizeBaseUrl(url: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `http://${url}`;
}

function getRuntimeBaseUrl() {
  const normalizedConfigured = normalizeBaseUrl(configuredBaseURL);
  if (normalizedConfigured) return normalizedConfigured;
  return defaultApiBaseUrl;
}

function buildUrl(path: string, baseUrl: string, params?: RequestConfig["params"]) {
  const url = new URL(path, baseUrl);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  }
  return url.toString();
}

function forceLogout() {
  clearSession();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

async function request<T>(method: HttpMethod, path: string, body?: unknown, config: RequestConfig = {}): Promise<{ data: T }> {
  const token = getAccessToken();
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(config.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const activeBaseUrl = config._baseOverride || getRuntimeBaseUrl();
  const response = await fetch(buildUrl(path, activeBaseUrl, config.params), {
    method,
    headers,
    body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
  });

  if (response.status === 401) {
    forceLogout();
    throw { message: "Session expired. Please login again.", status: 401 };
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      (json as { message?: string; error?: string }).message ||
      (json as { message?: string; error?: string }).error ||
      `Request failed with ${response.status} (${response.statusText}) for ${path}.`;
    throw { message, status: response.status };
  }

  return { data: json as T };
}

export const apiClient = {
  get: <T>(path: string, config?: RequestConfig) => request<T>("GET", path, undefined, config),
  post: <T>(path: string, body?: unknown, config?: RequestConfig) => request<T>("POST", path, body, config),
  put: <T>(path: string, body?: unknown, config?: RequestConfig) => request<T>("PUT", path, body, config),
  delete: <T>(path: string, config?: RequestConfig) => request<T>("DELETE", path, undefined, config),
};

export function getApiErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const maybe = error as { message?: string; error?: string };
    return maybe.message || maybe.error || "Request failed";
  }

  return "Something went wrong. Please try again.";
}
