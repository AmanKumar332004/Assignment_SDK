import { useCallback, useEffect, useState } from "react";
import { MediaError, MediaItem, MediaType } from "@headless-media/core";
import { useMediaClient } from "./context.js";

export interface UseMediaItemOptions {
  id: string | number | null | undefined;
  type?: MediaType;
  autoFetch?: boolean;
}

export interface UseMediaItemResult {
  item: MediaItem | null;
  isLoading: boolean;
  error: MediaError | Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch a single media item by ID.
 */
export function useMediaItem({
  id,
  type = "photo",
  autoFetch = true,
}: UseMediaItemOptions): UseMediaItemResult {
  const client = useMediaClient();

  const [item, setItem] = useState<MediaItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<MediaError | Error | null>(null);

  const fetchItem = useCallback(async () => {
    if (id === null || id === undefined || id === "") {
      setItem(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = type === "video" ? await client.getVideo(id) : await client.getPhoto(id);
      setItem(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new MediaError(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [client, id, type]);

  useEffect(() => {
    if (!autoFetch) return;

    let isCancelled = false;
    fetchItem().then(() => {
      if (isCancelled) return;
    });

    return () => {
      isCancelled = true;
    };
  }, [fetchItem, autoFetch]);

  return {
    item,
    isLoading,
    error,
    refresh: fetchItem,
  };
}

