import { useCallback, useEffect, useRef, useState } from "react";
import {
  MediaError,
  MediaItem,
  MediaPageResult,
  MediaSearchOptions,
  MediaType,
} from "@headless-media/core";
import { useMediaClient } from "./context.js";

export interface UseMediaSearchOptions extends MediaSearchOptions {
  query: string;
  type?: MediaType;
  autoFetch?: boolean;
}

export interface UseMediaSearchResult {
  items: MediaItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: MediaError | Error | null;
  hasMore: boolean;
  page: number;
  totalResults: number;
  isEmpty: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook to search media (photos or videos) using the MediaClient.
 *
 * Data Flow:
 * MediaProvider (Client) -> useMediaSearch (Hook state & pagination) -> UI Component
 */
export function useMediaSearch({
  query,
  type = "photo",
  page: initialPage = 1,
  perPage = 15,
  orientation,
  size,
  autoFetch = true,
}: UseMediaSearchOptions): UseMediaSearchResult {
  const client = useMediaClient();

  const [items, setItems] = useState<MediaItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<MediaError | Error | null>(null);

  // Active query signature ref to guard against out-of-order race conditions
  const activeSignatureRef = useRef<string>("");
  const trimmedQuery = query.trim();

  const executeFetch = useCallback(
    async (pageToFetch: number, isSubsequent: boolean) => {
      const signature = `${type}:${trimmedQuery}:${pageToFetch}:${perPage}:${orientation ?? ""}:${size ?? ""}`;
      activeSignatureRef.current = signature;

      if (isSubsequent) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      try {
        if (!trimmedQuery) {
          if (activeSignatureRef.current === signature) {
            setItems([]);
            setCurrentPage(1);
            setHasMore(false);
            setTotalResults(0);
          }
          return;
        }

        const options: MediaSearchOptions = {
          page: pageToFetch,
          perPage,
          orientation,
          size,
        };

        const result: MediaPageResult =
          type === "video"
            ? await client.searchVideos(trimmedQuery, options)
            : await client.searchPhotos(trimmedQuery, options);

        // Guard against race conditions where the user changed query before this promise resolved
        if (activeSignatureRef.current !== signature) {
          return;
        }

        if (isSubsequent) {
          setItems((prev) => [...prev, ...result.items]);
        } else {
          setItems(result.items);
        }

        setCurrentPage(result.pagination.page);
        setHasMore(result.pagination.hasMore);
        setTotalResults(result.pagination.totalResults);
        setError(null);
      } catch (err: unknown) {
        if (activeSignatureRef.current === signature) {
          setError(err instanceof Error ? err : new MediaError(String(err)));
        }
      } finally {
        if (activeSignatureRef.current === signature) {
          if (isSubsequent) {
            setIsLoadingMore(false);
          } else {
            setIsLoading(false);
          }
        }
      }
    },
    [client, type, trimmedQuery, perPage, orientation, size]
  );

  // Trigger search on query/type/filter change
  useEffect(() => {
    if (!autoFetch) return;

    if (!trimmedQuery) {
      setItems([]);
      setCurrentPage(1);
      setHasMore(false);
      setTotalResults(0);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;

    // Reset pagination to page 1 for new search parameters
    executeFetch(1, false).then(() => {
      if (isCancelled) return;
    });

    return () => {
      isCancelled = true;
    };
  }, [executeFetch, autoFetch, trimmedQuery, type, perPage, orientation, size]);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;
    await executeFetch(currentPage + 1, true);
  }, [executeFetch, isLoading, isLoadingMore, hasMore, currentPage]);

  const refresh = useCallback(async () => {
    await executeFetch(1, false);
  }, [executeFetch]);

  return {
    items,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    page: currentPage,
    totalResults,
    isEmpty: items.length === 0 && !isLoading && !error && trimmedQuery.length > 0,
    loadMore,
    refresh,
  };
}

