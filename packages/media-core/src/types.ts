/**
 * Core domain types for @headless-media/core
 * Pure TypeScript: No DOM, React, or browser globals.
 */

export type MediaType = "photo" | "video";

export interface MediaAuthor {
  name: string;
  url: string;
}

export interface VideoQualityFile {
  id: number;
  quality: string; // e.g. "hd", "sd"
  fileType: string; // e.g. "video/mp4"
  width: number | null;
  height: number | null;
  fps: number | null;
  link: string;
}

export interface MediaItem {
  id: string;
  sourceId: number;
  type: MediaType;
  title: string;
  width: number;
  height: number;
  aspectRatio: number;
  url: string; // Link to Pexels page
  previewUrl: string; // Thumbnail/poster for grid cards
  mediaUrl: string; // High-res image or primary video stream
  downloadUrl: string; // Link to download high-res file
  author: MediaAuthor;
  duration?: number; // Video duration in seconds
  videoFiles?: VideoQualityFile[]; // Detailed video formats if video
  avgColor?: string;
  raw: unknown; // Preserves complete raw Pexels payload
}

export interface MediaPagination {
  page: number;
  perPage: number;
  totalResults: number;
  hasMore: boolean;
  nextPage?: number;
}

export interface MediaPageResult {
  items: MediaItem[];
  pagination: MediaPagination;
}

export interface MediaSearchOptions {
  page?: number;
  perPage?: number;
  orientation?: "landscape" | "portrait" | "square";
  size?: "small" | "medium" | "large";
}

export interface MediaCuratedOptions {
  page?: number;
  perPage?: number;
}

/**
 * Minimal portable transport interface.
 * Avoids dependency on browser DOM `fetch` or Node types.
 */
export interface MediaTransportResponse {
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<unknown>;
}

export type MediaFetchFn = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
  }
) => Promise<MediaTransportResponse>;

export interface MediaClientConfig {
  /**
   * Pexels API Key. Must never be hard-coded.
   */
  apiKey: string;
  /**
   * Optional base API URL. Defaults to "https://api.pexels.com".
   */
  baseUrl?: string;
  /**
   * Optional custom fetch implementation (useful for tests or custom proxies).
   */
  fetch?: MediaFetchFn;
  /**
   * Cache time-to-live in milliseconds. Defaults to 5 minutes (300,000 ms).
   */
  cacheTtlMs?: number;
  /**
   * Enable default console logging for activity events (view/download).
   * Defaults to false (clean by default; can be turned on explicitly).
   */
  enableConsoleLogging?: boolean;
}

