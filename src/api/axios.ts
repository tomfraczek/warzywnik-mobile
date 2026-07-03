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
export const setAuthErrorHandler = (fn: ((status: number) => void) | null) => {
  authErrorHandler = fn;
};

// Timestamp of the last sign-in. Auth errors within 3s of sign-in are
// suppressed to avoid race-condition logouts during the Clerk token warm-up.
let lastSignInAt = 0;
export const markSignedIn = () => {
  lastSignInAt = Date.now();
};

let premiumErrorHandler: ((data: unknown) => void) | null = null;
export const setPremiumErrorHandler = (
  fn: ((data: unknown) => void) | null,
) => {
  premiumErrorHandler = fn;
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
    const responseData = err?.response?.data as
      | Record<string, unknown>
      | undefined;
    const requestHeaders = err?.config?.headers as Record<string, unknown> | undefined;
    const hadAuthHeader = !!(
      requestHeaders?.["Authorization"] ?? requestHeaders?.["authorization"]
    );
    if (status === 403 && responseData?.code === "PREMIUM_REQUIRED") {
      const details = responseData?.details as Record<string, unknown> | undefined;
      const reason = details?.reason as string | undefined;
      // Only show paywall for explicit user actions (limit/resource blocks).
      // FEATURE_LOCKED means a background query loaded a premium-only endpoint —
      // those components handle the locked state inline.
      if (reason === "LIMIT_REACHED" || reason === "RESOURCE_LOCKED") {
        premiumErrorHandler?.(responseData);
      }
    } else if ((status === 401 || status === 403) && hadAuthHeader) {
      const justSignedIn = Date.now() - lastSignInAt < 3000;
      if (!justSignedIn) {
        authErrorHandler?.(status);
      }
    }
    const isExpectedFeatureLock =
      status === 403 &&
      responseData?.code === "PREMIUM_REQUIRED" &&
      (responseData?.details as Record<string, unknown> | undefined)?.reason === "FEATURE_LOCKED";

    if (!isExpectedFeatureLock) {
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
    }
    return Promise.reject(err);
  },
);
