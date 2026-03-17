"use client";

import { AuthData } from "@/types/api";

const REFRESH_TOKEN_KEY = "cvru_admin_refresh_token";
const ROLES_KEY = "cvru_admin_roles";

let accessTokenMemory: string | null = null;

export function setSession(auth: AuthData) {
  accessTokenMemory = auth.accessToken;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
    window.localStorage.setItem(ROLES_KEY, JSON.stringify(auth.roles || []));
    document.cookie = `cvru_admin_authenticated=true; path=/; SameSite=Lax`;
  }
}

export function clearSession() {
  accessTokenMemory = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(ROLES_KEY);
    document.cookie = "cvru_admin_authenticated=; Max-Age=0; path=/; SameSite=Lax";
  }
}

export function getAccessToken() {
  return accessTokenMemory;
}

export function setAccessToken(token: string) {
  accessTokenMemory = token;
}

export function getRefreshToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getAccessToken() || getRefreshToken());
}

export function hasAdminRole() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const roles = JSON.parse(window.localStorage.getItem(ROLES_KEY) || "[]") as string[];
    return roles.includes("ADMIN");
  } catch {
    return false;
  }
}
