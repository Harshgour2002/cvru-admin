"use client";

import { endpoints } from "@/lib/api/endpoints";
import { clearSession, getAccessToken, getRefreshToken, setAccessToken } from "@/lib/auth/session";
import { ApiEnvelope, AuthData } from "@/types/api";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type RequestConfig = {
  params?: Record<string, string | number>;
  headers?: Record<string, string>;
  _retry?: boolean;
};

const configuredBaseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function normalizeBaseUrl(url: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `http://${url}`;
}

function getRuntimeBaseUrl() {
  const normalizedConfigured = normalizeBaseUrl(configuredBaseURL);
  if (normalizedConfigured) return normalizedConfigured;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

function buildUrl(path: string, params?: RequestConfig["params"]) {
  const url = new URL(path, getRuntimeBaseUrl());
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  }
  return url.toString();
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return null;

      try {
        const response = await fetch(buildUrl(endpoints.auth.refresh), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        const json = (await response.json()) as ApiEnvelope<AuthData>;
        const token = json.data.accessToken;
        setAccessToken(token);
        return token;
      } catch {
        clearSession();
        if (typeof window !== "undefined") window.location.href = "/login";
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

async function request<T>(method: HttpMethod, path: string, body?: unknown, config: RequestConfig = {}): Promise<{ data: T }> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(config.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(buildUrl(path, config.params), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !config._retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(method, path, body, {
        ...config,
        _retry: true,
        headers: { ...(config.headers || {}), Authorization: `Bearer ${newToken}` },
      });
    }
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw json;
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
