import axios, { InternalAxiosRequestConfig } from "axios";

export const restClient = axios.create({
  timeout: 5000,
  baseURL: "http://localhost:3000", // zmień na swój backend
});

// Dodawanie tokenu do każdego requestu (jeśli ustawiony)
restClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (restClient.defaults.headers.Authorization) {
    config.headers.Authorization = restClient.defaults.headers.Authorization;
  }
  return config;
});

// Prosty interceptor odpowiedzi (można rozbudować)
restClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API error:", error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Ustawianie tokenu
export const authorizeAxiosClient = (token: string) => {
  restClient.defaults.headers.Authorization = `Bearer ${token}`;
};

// Usuwanie tokenu
export const unauthorizeAxiosClient = () => {
  delete restClient.defaults.headers.Authorization;
};

// Zmiana domeny (jeśli potrzebujesz np. środowisk dev/staging/prod)
export const changeAxiosClientDomain = (baseURL: string) => {
  restClient.defaults.baseURL = baseURL;
};

// Parser błędów z odpowiedzi
export const getResponseError = (
  error: unknown
): { status: number; message: string } => {
  const defaultError = {
    message: "Unknown error",
    status: 500,
  };

  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as any).response === "object"
  ) {
    const response = (error as any).response;

    if (
      response &&
      typeof response === "object" &&
      "data" in response &&
      "status" in response
    ) {
      const data = response.data;
      const status = response.status;

      if (
        data &&
        typeof data === "object" &&
        "error" in data &&
        typeof data.error === "object" &&
        "message" in data.error
      ) {
        return {
          message: data.error.message,
          status,
        };
      }

      if ("message" in data && typeof data.message === "string") {
        return {
          message: data.message,
          status,
        };
      }
    }
  }

  return defaultError;
};
