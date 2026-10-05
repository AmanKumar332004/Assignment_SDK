/**
 * Structured error classes for @headless-media/core.
 * Carefully sanitizes messages to prevent API key exposure.
 */

export class MediaError extends Error {
  public readonly code: string;

  constructor(message: string, code = "MEDIA_ERROR") {
    super(message);
    this.name = "MediaError";
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class MediaConfigError extends MediaError {
  constructor(message: string) {
    super(message, "CONFIG_ERROR");
    this.name = "MediaConfigError";
  }
}

export class MediaApiError extends MediaError {
  public readonly status: number;
  public readonly statusText: string;
  public readonly responseBody?: unknown;

  constructor(status: number, statusText: string, message: string, responseBody?: unknown) {
    super(`Pexels API Error [${status} ${statusText}]: ${message}`, "API_ERROR");
    this.name = "MediaApiError";
    this.status = status;
    this.statusText = statusText;
    this.responseBody = responseBody;
  }
}

export class MediaNetworkError extends MediaError {
  public readonly originalError?: unknown;

  constructor(message: string, originalError?: unknown) {
    super(`Network error while contacting media API: ${message}`, "NETWORK_ERROR");
    this.name = "MediaNetworkError";
    this.originalError = originalError;
  }
}

