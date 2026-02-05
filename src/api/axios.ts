import axios, { AxiosError, isAxiosError } from "axios";

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export const restClient = axios.create({
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
    console.error("API error:", err?.response?.data || err.message);
    return Promise.reject(err);
  },
);
