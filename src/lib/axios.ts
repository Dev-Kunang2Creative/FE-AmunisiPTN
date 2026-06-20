import axios from "axios";
import { getCsrfToken } from "next-auth/react";

export const AUTH_TOKEN_INVALID_EVENT = "amunisi:auth-token-invalid";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Accept": "application/json",
  },
  timeout: 30000,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;
    const url = String(originalRequest?.url || "");
    const authorization = String(originalRequest?.headers?.Authorization || "");
    const hasBearerToken = authorization.startsWith("Bearer ") && authorization.trim() !== "Bearer";

    if (
      status === 401 &&
      typeof window !== "undefined" &&
      hasBearerToken &&
      !url.includes("/auth/login") &&
      !url.includes("/auth/refresh") &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise<string>(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const csrfToken = await getCsrfToken();
        const res = await fetch("/api/auth/session", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ csrfToken, data: { forceRefresh: true } })
        });
        const session = await res.json();

        if (session && session.access_token && session.authError !== "REFRESH_TOKEN_ERROR" && session.authError !== "TOKEN_INVALID") {
           processQueue(null, session.access_token);
           originalRequest.headers["Authorization"] = "Bearer " + session.access_token;
           return api(originalRequest);
        } else {
           throw new Error("No valid session after refresh");
        }
      } catch (err) {
        processQueue(err, null);
        window.dispatchEvent(new CustomEvent(AUTH_TOKEN_INVALID_EVENT));
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    if (
      status === 401 &&
      typeof window !== "undefined" &&
      hasBearerToken &&
      !url.includes("/auth/login") &&
      originalRequest._retry
    ) {
      window.dispatchEvent(new CustomEvent(AUTH_TOKEN_INVALID_EVENT));
    }

    return Promise.reject(error);
  },
);

export { api };
