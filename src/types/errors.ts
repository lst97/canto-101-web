// Centralized error type definitions for network/API/runtime errors
// Discriminated union enables exhaustive handling without relying on try/catch in components.
export type NetworkError = {
  kind: "network";
  message: string;
  status?: number;
  cause?: unknown;
  retriable: boolean;
};

export type ApiError = {
  kind: "api";
  message: string;
  status: number;
  code?: string;
  details?: unknown;
  cause?: unknown;
  retriable: boolean;
};

export type UnexpectedError = {
  kind: "unexpected";
  message: string;
  cause?: unknown;
};

export type AppError = NetworkError | ApiError | UnexpectedError;

export function isAppError(error: unknown): error is AppError {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as { kind?: unknown; message?: unknown };
  if (typeof candidate.kind !== "string") {
    return false;
  }

  return candidate.kind === "network"
    || candidate.kind === "api"
    || candidate.kind === "unexpected";
}

export interface NormalizedApiErrorShape {
  message: string;
  status?: number;
  cause?: unknown;
}

export function toUnexpected(error: unknown): UnexpectedError {
  return {
    kind: "unexpected",
    message: error instanceof Error ? error.message : String(error),
    cause: error,
  };
}
