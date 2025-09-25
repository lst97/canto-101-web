import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { AppError, ApiError, NetworkError, UnexpectedError } from "@/types/errors";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://175.33.104.105:3000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // withCredentials could be enabled here if auth cookies later
});

// BACKWARDS COMPAT shape (used in some existing hooks). Keep until migration complete.
export interface NormalizedApiError { message: string; status?: number; cause?: unknown }

function extractMessage(data: unknown): string | undefined {
  if (typeof data === "string") {
    return data;
  }
  if (typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;

    const errorValue = record.error;
    if (typeof errorValue === "string") {
      return errorValue;
    }
    if (typeof errorValue === "object" && errorValue !== null) {
      const nestedMessage = (errorValue as Record<string, unknown>).message;
      if (nestedMessage !== undefined) {
        return String(nestedMessage);
      }
    }

    const messageValue = record.message;
    if (messageValue !== undefined) {
      return String(messageValue);
    }
  }
  return undefined;
}

export function normalizeError(error: unknown): NormalizedApiError {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError;
    return {
      message: extractMessage(axiosErr.response?.data) || axiosErr.message || "Request failed",
      status: axiosErr.response?.status,
      cause: error,
    };
  }
  return { message: error instanceof Error ? error.message : String(error) };
}

export class AppNetworkError extends Error implements NetworkError {
  kind: NetworkError["kind"] = "network";
  status?: number;
  retriable: boolean;
  cause?: unknown;
  constructor(message: string, opts: { status?: number; cause?: unknown; retriable?: boolean } = {}) {
    super(message);
    this.status = opts.status;
    this.cause = opts.cause;
    this.retriable = opts.retriable ?? true;
  }
}

export class AppApiError extends Error implements ApiError {
  kind: ApiError["kind"] = "api";
  status: number;
  code?: string;
  details?: unknown;
  retriable: boolean;
  cause?: unknown;
  constructor(message: string, status: number, opts: { code?: string; details?: unknown; cause?: unknown; retriable?: boolean } = {}) {
    super(message);
    this.status = status;
    this.code = opts.code;
    this.details = opts.details;
    this.cause = opts.cause;
    this.retriable = opts.retriable ?? status >= 500; // retry only server errors by default
  }
}

export class AppUnexpectedError extends Error implements UnexpectedError {
  kind: UnexpectedError["kind"] = "unexpected";
  cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}

export function toAppError(error: unknown): AppError {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError;
    const status = axiosErr.response?.status;
    const data = axiosErr.response?.data;
    const message = extractMessage(data) || axiosErr.message || "Request failed";
    if (status && status >= 400) {
      return new AppApiError(message, status, { details: data, cause: error });
    }
    // Network error (no response)
    if (!axiosErr.response) {
      return new AppNetworkError(message, { cause: error, retriable: true });
    }
  }
  return new AppUnexpectedError(error instanceof Error ? error.message : String(error), error);
}

// Attach interceptors to transform errors before reaching calling code. This avoids pervasive try/catch in components.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Placeholder: attach auth tokens or trace IDs later
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    // Always throw typed AppError for downstream consumers / React Query error handling
    throw toAppError(error);
  },
);
