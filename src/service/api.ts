import axios, { AxiosRequestConfig } from "axios";

interface RequestParams {
  method?: AxiosRequestConfig["method"];
  headers?: AxiosRequestConfig["headers"];
  endpoint: string;
  data?: AxiosRequestConfig["data"];
  params?: AxiosRequestConfig["params"];
  loaderStateSetter?: (state: boolean) => void;
}

export const getApiErrorMessage = (error: any): string => {
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim()) return data;

  const message = typeof data?.message === "string" ? data.message : "";
  const errors = data?.errors;

  if (errors && typeof errors === "object") {
    const fieldMessages: string[] = [];
    for (const value of Object.values(errors)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === "string" && item.trim()) fieldMessages.push(item);
        }
      } else if (typeof value === "string" && value.trim()) {
        fieldMessages.push(value);
      }
    }

    const unique = Array.from(new Set([message, ...fieldMessages].filter(Boolean)));
    if (unique.length > 0) return unique[0];
  }

  if (message) return message;

  const fallback = typeof error?.message === "string" ? error.message : "";
  if (fallback) return fallback;

  return "Ocorreu um erro inesperado. Tente novamente.";
};

const toggleLoader = (
  loaderStateSetter: ((state: boolean) => void) | undefined,
  state: boolean
) => {
  if (loaderStateSetter) {
    loaderStateSetter(state);
  }
};

export const request = async ({
  method = "get",
  headers = {},
  endpoint,
  data,
  params,
  loaderStateSetter,
}: RequestParams) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const config: AxiosRequestConfig = {
    method,
    baseURL: baseUrl,
    url: endpoint,
    data,
    params,
    timeout: 7000,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  toggleLoader(loaderStateSetter, true);

  try {
    const result = await axios(config);
    return result;
  } catch (error: any) {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    throw error;
  } finally {
    toggleLoader(loaderStateSetter, false);
  }
};
