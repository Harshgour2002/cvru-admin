"use client";

import { endpoints } from "@/lib/api/endpoints";
import { clearSession, getAccessToken, getRefreshToken, setAccessToken } from "@/lib/auth/session";
import { ApiEnvelope, AuthData } from "@/types/api";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type RequestConfig = {
  params?: Record<string, string | number>;
  headers?: Record<string, string>;
  _retry?: boolean;
  _baseOverride?: string;
};

const configuredBaseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const defaultApiBaseUrl = "http://localhost:8080";

function normalizeBaseUrl(url: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `http://${url}`;
}

function getConfiguredBaseUrl() {
  return normalizeBaseUrl(configuredBaseURL);
}

function getRuntimeBaseUrl() {
  const normalizedConfigured = getConfiguredBaseUrl();
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

function shouldRetryWithDefaultBackend(path: string, response: Response, attemptedBaseUrl: string) {
  if (response.status !== 404 || !path.startsWith("/api/")) return false;
  if (attemptedBaseUrl === defaultApiBaseUrl) return false;
  if (typeof window === "undefined") return false;

  try {
    const attemptedOrigin = new URL(attemptedBaseUrl).origin;
    return attemptedOrigin === window.location.origin;
  } catch {
    return false;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return null;

      try {
        const response = await fetch(buildUrl(endpoints.auth.refresh, getRuntimeBaseUrl()), {
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

  const activeBaseUrl = config._baseOverride || getRuntimeBaseUrl();
  const response = await fetch(buildUrl(path, activeBaseUrl, config.params), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (shouldRetryWithDefaultBackend(path, response, activeBaseUrl)) {
    return request<T>(method, path, body, {
      ...config,
      _baseOverride: defaultApiBaseUrl,
    });
  }

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
    const message =
      (json as { message?: string; error?: string }).message ||
      (json as { message?: string; error?: string }).error ||
      `Request failed with ${response.status} (${response.statusText}) for ${path}. Check NEXT_PUBLIC_API_BASE_URL.`;

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
