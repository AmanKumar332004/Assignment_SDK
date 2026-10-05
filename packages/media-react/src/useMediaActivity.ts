import { useCallback, useEffect, useRef } from "react";
import { MediaActivityEvent, MediaActivityListener, MediaItem } from "@headless-media/core";
import { useMediaClient } from "./context.js";

export interface UseMediaActivityResult {
  recordView: (item: MediaItem) => void;
  recordDownload: (item: MediaItem) => void;
}

/**
 * Hook to subscribe to media activity events (views, downloads)
 * and provide dispatch helpers to record user actions.
 * Automatically cleans up subscriptions on component unmount.
 */
export function useMediaActivity(listener?: MediaActivityListener): UseMediaActivityResult {
  const client = useMediaClient();
  const listenerRef = useRef<MediaActivityListener | undefined>(listener);

  // Keep listener ref updated to avoid re-subscribing on inline callback recreation
  useEffect(() => {
    listenerRef.current = listener;
  }, [listener]);

  useEffect(() => {
    if (!listener) return;

    const unsubscribe = client.activity.subscribe((event: MediaActivityEvent) => {
      listenerRef.current?.(event);
    });

    return () => {
      unsubscribe();
    };
  }, [client, Boolean(listener)]);

  const recordView = useCallback(
    (item: MediaItem) => {
      client.activity.recordView(item);
    },
    [client]
  );

  const recordDownload = useCallback(
    (item: MediaItem) => {
      client.activity.recordDownload(item);
    },
    [client]
  );

  return {
    recordView,
    recordDownload,
  };
}

