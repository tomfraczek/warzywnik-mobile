import { AxiosError, create, isAxiosError } from "axios";

const fallbackApiBaseUrl = "https://warzywnik-app-q8l4o.ondigitalocean.app/v1";

const rawApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? fallbackApiBaseUrl;

const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, "");

export const restClient = create({
  timeout: 5000,
  baseURL: apiBaseUrl,
});

let tokenProvider: (() => Promise<string | null>) | null = null;
export const setAuthTokenProvider = (fn: () => Promise<string | null>) => {
  tokenProvider = fn;
};

let authErrorHandler: ((status: number) => void) | null = null;
export const setAuthErrorHandler = (fn: (status: number) => void) => {
  authErrorHandler = fn;
};

export const getResponseError = (error: unknown) => {
  if (!error) return "Unknown error";
  if (isAxiosError(error)) {
    const err = error as AxiosError<{ message?: string }>;
    return (
      err.response?.data?.message ||
      err.response?.status ||
      err.message ||
      "Unknown error"
    );
  }
  if (error instanceof Error) return error.message;
  return "Unknown error";
};

restClient.interceptors.request.use(async (config) => {
  if (tokenProvider) {
    const token = await tokenProvider().catch(() => null);
    if (token) {
      if (!config.headers) config.headers = {} as any;
      (config.headers as any)["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

restClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      authErrorHandler?.(status);
    }
    if (__DEV__) {
      console.error("API error:", {
        status,
        url: err?.config?.url,
        method: err?.config?.method,
        data: err?.response?.data || err.message,
      });
    } else {
      console.error("API error:", err?.response?.data || err.message);
    }
    return Promise.reject(err);
  },
);
