/**
 * Framework-independent MediaClient for Pexels.
 * Encapsulates network communication, caching, data normalization,
 * activity tracking, and structured error handling.
 */

import {
  MediaClientConfig,
  MediaCuratedOptions,
  MediaFetchFn,
  MediaItem,
  MediaPageResult,
  MediaSearchOptions,
  MediaTransportResponse,
} from "./types.js";
import {
  MediaApiError,
  MediaConfigError,
  MediaError,
  MediaNetworkError,
} from "./errors.js";
import { MediaCache } from "./cache.js";
import { MediaEventEmitter } from "./events.js";
import { normalizePhoto, normalizeVideo } from "./normalizers.js";

interface PexelsPhotoListResponse {
  page: number;
  per_page: number;
  total_results: number;
  photos: unknown[];
  next_page?: string;
}

interface PexelsVideoListResponse {
  page: number;
  per_page: number;
  total_results: number;
  videos: unknown[];
  next_page?: string;
}

export class MediaClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchFn: MediaFetchFn;
  public readonly cache: MediaCache;
  public readonly activity: MediaEventEmitter;

  constructor(config: MediaClientConfig) {
    if (!config || !config.apiKey || typeof config.apiKey !== "string" || config.apiKey.trim().length === 0) {
      throw new MediaConfigError(
        "A valid Pexels API key must be provided to initialize MediaClient. Please check your environment configuration."
      );
    }

    this.apiKey = config.apiKey.trim();
    this.baseUrl = (config.baseUrl ?? "https://api.pexels.com").replace(/\/$/, "");
    this.cache = new MediaCache({ ttlMs: config.cacheTtlMs });
    this.activity = new MediaEventEmitter(config.enableConsoleLogging ?? false);

    // Setup portable transport
    if (config.fetch) {
      this.fetchFn = config.fetch;
    } else if (typeof globalThis !== "undefined" && typeof (globalThis as unknown as { fetch?: unknown }).fetch === "function") {
      const gFetch = (globalThis as unknown as { fetch: (url: string, init?: unknown) => Promise<MediaTransportResponse> }).fetch;
      this.fetchFn = (url, init) => gFetch(url, init);
    } else {
      throw new MediaConfigError(
        "No global fetch found and no custom fetch transport provided to MediaClient."
      );
    }
  }

  /**
   * Safe internal request helper that manages authorization, error mapping, and JSON parsing.
   * Guarantees that API keys and authorization headers are NEVER logged or leaked.
   */
  private async request<T>(endpoint: string, searchParams?: Record<string, string | number | undefined>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`);
    if (searchParams) {
      for (const [key, val] of Object.entries(searchParams)) {
        if (val !== undefined && val !== null && val !== "") {
          url.searchParams.set(key, String(val));
        }
      }
    }

    const requestUrl = url.toString();

    let response: MediaTransportResponse;
    try {
      response = await this.fetchFn(requestUrl, {
        method: "GET",
        headers: {
          Authorization: this.apiKey,
          Accept: "application/json",
        },
      });
    } catch (networkErr: unknown) {
      const msg = networkErr instanceof Error ? networkErr.message : "Unknown connection failure";
      throw new MediaNetworkError(msg, networkErr);
    }

    if (!response.ok) {
      let errorBody: unknown = undefined;
      let parsedMessage = response.statusText || "Request failed";
      try {
        errorBody = await response.json();
        if (errorBody && typeof errorBody === "object") {
          const eb = errorBody as Record<string, unknown>;
          if (typeof eb.error === "string") {
            parsedMessage = eb.error;
          } else if (typeof eb.message === "string") {
            parsedMessage = eb.message;
          }
        }
      } catch {
        // Keep fallback message if body is not JSON
      }

      if (response.status === 401) {
        throw new MediaApiError(
          401,
          "Unauthorized",
          "Invalid or missing Pexels API key. Please check your credentials.",
          errorBody
        );
      } else if (response.status === 403) {
        throw new MediaApiError(
          403,
          "Forbidden",
          "Access to this Pexels endpoint is forbidden.",
          errorBody
        );
      } else if (response.status === 429) {
        throw new MediaApiError(
          429,
          "Rate Limited",
          "Pexels API rate limit exceeded. Please wait before retrying.",
          errorBody
        );
      } else if (response.status === 404) {
        throw new MediaApiError(
          404,
          "Not Found",
          "The requested media resource was not found.",
          errorBody
        );
      } else {
        throw new MediaApiError(
          response.status,
          response.statusText,
          parsedMessage,
          errorBody
        );
      }
    }

    try {
      return (await response.json()) as T;
    } catch (parseErr: unknown) {
      throw new MediaError(
        `Failed to parse response JSON: ${parseErr instanceof Error ? parseErr.message : "Malformed JSON"}`
      );
    }
  }

  /**
   * Search photos with pagination and optional filters.
   */
  public async searchPhotos(query: string, options?: MediaSearchOptions): Promise<MediaPageResult> {
    const cleanQuery = query.trim();
    const page = Math.max(1, options?.page ?? 1);
    const perPage = Math.min(80, Math.max(1, options?.perPage ?? 15));

    if (!cleanQuery) {
      return {
        items: [],
        pagination: { page, perPage, totalResults: 0, hasMore: false },
      };
    }

    const cacheKey = `photos:search:${cleanQuery}:${page}:${perPage}:${options?.orientation ?? ""}:${options?.size ?? ""}`;

    return this.cache.getOrFetch(cacheKey, async () => {
      const raw = await this.request<PexelsPhotoListResponse>("/v1/search", {
        query: cleanQuery,
        page,
        per_page: perPage,
        orientation: options?.orientation,
        size: options?.size,
      });

      const items = (raw.photos || []).map(normalizePhoto);
      const totalResults = raw.total_results || 0;
      const hasMore = page * perPage < totalResults;

      return {
        items,
        pagination: {
          page,
          perPage,
          totalResults,
          hasMore,
          nextPage: hasMore ? page + 1 : undefined,
        },
      };
    });
  }

  /**
   * Search videos with pagination.
   */
  public async searchVideos(query: string, options?: MediaSearchOptions): Promise<MediaPageResult> {
    const cleanQuery = query.trim();
    const page = Math.max(1, options?.page ?? 1);
    const perPage = Math.min(80, Math.max(1, options?.perPage ?? 15));

    if (!cleanQuery) {
      return {
        items: [],
        pagination: { page, perPage, totalResults: 0, hasMore: false },
      };
    }

    const cacheKey = `videos:search:${cleanQuery}:${page}:${perPage}:${options?.orientation ?? ""}:${options?.size ?? ""}`;

    return this.cache.getOrFetch(cacheKey, async () => {
      const raw = await this.request<PexelsVideoListResponse>("/videos/search", {
        query: cleanQuery,
        page,
        per_page: perPage,
        orientation: options?.orientation,
        size: options?.size,
      });

      const items = (raw.videos || []).map(normalizeVideo);
      const totalResults = raw.total_results || 0;
      const hasMore = page * perPage < totalResults;

      return {
        items,
        pagination: {
          page,
          perPage,
          totalResults,
          hasMore,
          nextPage: hasMore ? page + 1 : undefined,
        },
      };
    });
  }

  /**
   * Fetch curated/trending photos.
   */
  public async getCuratedPhotos(options?: MediaCuratedOptions): Promise<MediaPageResult> {
    const page = Math.max(1, options?.page ?? 1);
    const perPage = Math.min(80, Math.max(1, options?.perPage ?? 15));
    const cacheKey = `photos:curated:${page}:${perPage}`;

    return this.cache.getOrFetch(cacheKey, async () => {
      const raw = await this.request<PexelsPhotoListResponse>("/v1/curated", {
        page,
        per_page: perPage,
      });

      const items = (raw.photos || []).map(normalizePhoto);
      const totalResults = raw.total_results || 0;
      const hasMore = page * perPage < totalResults;

      return {
        items,
        pagination: {
          page,
          perPage,
          totalResults,
          hasMore,
          nextPage: hasMore ? page + 1 : undefined,
        },
      };
    });
  }

  /**
   * Fetch popular videos.
   */
  public async getPopularVideos(options?: MediaCuratedOptions): Promise<MediaPageResult> {
    const page = Math.max(1, options?.page ?? 1);
    const perPage = Math.min(80, Math.max(1, options?.perPage ?? 15));
    const cacheKey = `videos:popular:${page}:${perPage}`;

    return this.cache.getOrFetch(cacheKey, async () => {
      const raw = await this.request<PexelsVideoListResponse>("/videos/popular", {
        page,
        per_page: perPage,
      });

      const items = (raw.videos || []).map(normalizeVideo);
      const totalResults = raw.total_results || 0;
      const hasMore = page * perPage < totalResults;

      return {
        items,
        pagination: {
          page,
          perPage,
          totalResults,
          hasMore,
          nextPage: hasMore ? page + 1 : undefined,
        },
      };
    });
  }

  /**
   * Fetch a single photo by ID.
   */
  public async getPhoto(id: number | string): Promise<MediaItem> {
    const numericId = String(id).replace(/^photo-/, "");
    const cacheKey = `photo:detail:${numericId}`;

    return this.cache.getOrFetch(cacheKey, async () => {
      const raw = await this.request<unknown>(`/v1/photos/${numericId}`);
      return normalizePhoto(raw);
    });
  }

  /**
   * Fetch a single video by ID.
   */
  public async getVideo(id: number | string): Promise<MediaItem> {
    const numericId = String(id).replace(/^video-/, "");
    const cacheKey = `video:detail:${numericId}`;

    return this.cache.getOrFetch(cacheKey, async () => {
      const raw = await this.request<unknown>(`/videos/videos/${numericId}`);
      return normalizeVideo(raw);
    });
  }
}

/**
 * Factory helper function to create a new MediaClient.
 */
export function createMediaClient(config: MediaClientConfig): MediaClient {
  return new MediaClient(config);
}

