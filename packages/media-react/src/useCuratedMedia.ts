import { useCallback, useEffect, useRef, useState } from "react";
import {
  MediaCuratedOptions,
  MediaError,
  MediaItem,
  MediaPageResult,
  MediaType,
} from "@headless-media/core";
import { useMediaClient } from "./context.js";

export interface UseCuratedMediaOptions extends MediaCuratedOptions {
  type?: MediaType;
  autoFetch?: boolean;
}

export interface UseCuratedMediaResult {
  items: MediaItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: MediaError | Error | null;
  hasMore: boolean;
  page: number;
  totalResults: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch curated photos or popular videos.
 */
export function useCuratedMedia({
  type = "photo",
  page: initialPage = 1,
  perPage = 15,
  autoFetch = true,
}: UseCuratedMediaOptions = {}): UseCuratedMediaResult {
  const client = useMediaClient();

  const [items, setItems] = useState<MediaItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<MediaError | Error | null>(null);

  const activeSignatureRef = useRef<string>("");

  const executeFetch = useCallback(
    async (pageToFetch: number, isSubsequent: boolean) => {
      const signature = `curated:${type}:${pageToFetch}:${perPage}`;
      activeSignatureRef.current = signature;

      if (isSubsequent) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      try {
        const options: MediaCuratedOptions = { page: pageToFetch, perPage };
        const result: MediaPageResult =
          type === "video"
            ? await client.getPopularVideos(options)
            : await client.getCuratedPhotos(options);

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
    [client, type, perPage]
  );

  useEffect(() => {
    if (!autoFetch) return;

    let isCancelled = false;
    executeFetch(1, false).then(() => {
      if (isCancelled) return;
    });

    return () => {
      isCancelled = true;
    };
  }, [executeFetch, autoFetch, type, perPage]);

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
    loadMore,
    refresh,
  };
}

