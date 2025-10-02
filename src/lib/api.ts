import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type {
  ApiError,
  AppError,
  NetworkError,
  UnexpectedError,
} from '../types/errors.ts';
import {
  ApiDirectErrorResponseSchema,
  ApiErrorResponseSchema,
} from './schemas/api-response.ts';

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials could be enabled here if auth cookies later
});

// BACKWARDS COMPAT shape (used in some existing hooks). Keep until migration complete.
export interface NormalizedApiError {
  message: string;
  status?: number;
  cause?: unknown;
}

function extractMessage(data: unknown): string | undefined {
  if (typeof data === 'string') {
    return data;
  }
  if (typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>;

    // Try to parse as structured API error response (nested under error key)
    const parseResult = ApiErrorResponseSchema.safeParse(data);
    if (parseResult.success) {
      const errorData = parseResult.data.error;
      if (typeof errorData.message === 'string') {
        return errorData.message;
      }
      if (Array.isArray(errorData.message)) {
        // Join multiple error messages with semicolons
        return errorData.message.map(detail => detail.message).join('; ');
      }
    }

    // Try to parse as direct API error response
    const directParseResult = ApiDirectErrorResponseSchema.safeParse(data);
    if (directParseResult.success) {
      const errorData = directParseResult.data;
      if (typeof errorData.message === 'string') {
        return errorData.message;
      }
      if (Array.isArray(errorData.message)) {
        // Join multiple error messages with semicolons
        return errorData.message.map(detail => detail.message).join('; ');
      }
    }

    // Fallback: check for direct error fields
    const errorValue = record.error;
    if (typeof errorValue === 'string') {
      return errorValue;
    }
    if (typeof errorValue === 'object' && errorValue !== null) {
      const nestedMessage = (errorValue as Record<string, unknown>).message;
      if (nestedMessage !== undefined) {
        return String(nestedMessage);
      }
    }

    // Check for direct message field
    const messageValue = record.message;
    if (messageValue !== undefined) {
      return String(messageValue);
    }

    // Check if the entire response is an error object
    if (record.code && record.message) {
      if (typeof record.message === 'string') {
        return record.message;
      }
      if (Array.isArray(record.message)) {
        return record.message
          .map(m => {
            if (typeof m === 'string') return m;
            if (typeof m === 'object' && m !== null && 'message' in m) {
              const value = (m as { message?: unknown }).message;
              return typeof value === 'string'
                ? value
                : value !== undefined
                  ? String(value)
                  : '';
            }
            return String(m);
          })
          .filter(segment => segment.length > 0)
          .join('; ');
      }
    }
  }
  return undefined;
}

export function normalizeError(error: unknown): NormalizedApiError {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError;
    return {
      message:
        extractMessage(axiosErr.response?.data) ||
        axiosErr.message ||
        'Request failed',
      status: axiosErr.response?.status,
      cause: error,
    };
  }
  return { message: error instanceof Error ? error.message : String(error) };
}

export class AppNetworkError extends Error implements NetworkError {
  kind: NetworkError['kind'] = 'network';
  status?: number;
  retriable: boolean;
  cause?: unknown;
  constructor(
    message: string,
    opts: { status?: number; cause?: unknown; retriable?: boolean } = {}
  ) {
    super(message);
    this.status = opts.status;
    this.cause = opts.cause;
    this.retriable = opts.retriable ?? true;
  }
}

export class AppApiError extends Error implements ApiError {
  kind: ApiError['kind'] = 'api';
  status: number;
  code?: string;
  details?: unknown;
  retriable: boolean;
  cause?: unknown;
  constructor(
    message: string,
    status: number,
    opts: {
      code?: string;
      details?: unknown;
      cause?: unknown;
      retriable?: boolean;
    } = {}
  ) {
    super(message);
    this.status = status;
    this.code = opts.code;
    this.details = opts.details;
    this.cause = opts.cause;
    this.retriable = opts.retriable ?? status >= 500; // retry only server errors by default
  }
}

export class AppUnexpectedError extends Error implements UnexpectedError {
  kind: UnexpectedError['kind'] = 'unexpected';
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
    const message =
      extractMessage(data) || axiosErr.message || 'Request failed';
    if (status && status >= 400) {
      return new AppApiError(message, status, { details: data, cause: error });
    }
    // Network error (no response)
    if (!axiosErr.response) {
      return new AppNetworkError(message, { cause: error, retriable: true });
    }
  }
  return new AppUnexpectedError(
    error instanceof Error ? error.message : String(error),
    error
  );
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
  }
);
