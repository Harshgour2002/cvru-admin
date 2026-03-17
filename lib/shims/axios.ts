import { clearSession, getAccessToken } from "@/lib/auth/session";

export type AxiosResponse<T = unknown> = {
  data: T;
  status: number;
};

type RequestConfig = {
  baseURL?: string;
  params?: Record<string, string | number>;
  headers?: Record<string, string>;
};

type AxiosInstance = {
  get: <T = unknown>(url: string, config?: RequestConfig) => Promise<AxiosResponse<T>>;
  post: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) => Promise<AxiosResponse<T>>;
  put: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) => Promise<AxiosResponse<T>>;
  delete: <T = unknown>(url: string, config?: RequestConfig) => Promise<AxiosResponse<T>>;
};

function normalizeBaseUrl(url?: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `http://${url}`;
}

function buildUrl(url: string, config?: RequestConfig) {
  const base = normalizeBaseUrl(config?.baseURL) || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  const fullUrl = new URL(url, base);
  if (config?.params) {
    Object.entries(config.params).forEach(([k, v]) => fullUrl.searchParams.set(k, String(v)));
  }
  return fullUrl.toString();
}

function onUnauthorized() {
  clearSession();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

async function request<T>(method: string, url: string, data?: unknown, config?: RequestConfig): Promise<AxiosResponse<T>> {
  const token = getAccessToken();
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;

  const response = await fetch(buildUrl(url, config), {
    method,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(config?.headers || {}),
    },
    body: data ? (isFormData ? (data as FormData) : JSON.stringify(data)) : undefined,
  });

  if (response.status === 401) {
    onUnauthorized();
    throw { message: "Session expired. Please login again.", status: 401 };
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw json;
  }

  return { data: json as T, status: response.status };
}

export function create(defaultConfig?: RequestConfig): AxiosInstance {
  return {
    get: <T = unknown>(url: string, config?: RequestConfig) => request<T>("GET", url, undefined, { ...defaultConfig, ...config }),
    post: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) => request<T>("POST", url, data, { ...defaultConfig, ...config }),
    put: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) => request<T>("PUT", url, data, { ...defaultConfig, ...config }),
    delete: <T = unknown>(url: string, config?: RequestConfig) => request<T>("DELETE", url, undefined, { ...defaultConfig, ...config }),
  };
}

const axios = { create };

export default axios;
