import React, { useCallback, useEffect, useRef } from "react";
import { HeadlessMediaItem } from "../types.js";

export interface UseMediaGridOptions<T extends HeadlessMediaItem = HeadlessMediaItem> {
  items: T[];
  onItemSelect?: (item: T, index: number) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  /**
   * Root margin for IntersectionObserver sentinel. Defaults to "200px".
   */
  sentinelRootMargin?: string;
  ariaLabel?: string;
}

export interface UseMediaGridResult<T extends HeadlessMediaItem = HeadlessMediaItem> {
  getGridProps: () => React.HTMLAttributes<HTMLDivElement>;
  getItemProps: (
    item: T,
    index: number,
    additionalProps?: React.HTMLAttributes<HTMLElement>
  ) => React.HTMLAttributes<HTMLElement> & {
    role: string;
    tabIndex: number;
    onClick: React.MouseEventHandler;
    onKeyDown: React.KeyboardEventHandler;
  };
  getSentinelProps: () => {
    ref: React.RefCallback<HTMLElement>;
    "aria-hidden": boolean;
  };
  hasIntersectionObserver: boolean;
}

/**
 * Headless hook managing media grid keyboard interaction,
 * accessible attributes, and infinite scroll intersection observation.
 */
export function useMediaGrid<T extends HeadlessMediaItem = HeadlessMediaItem>({
  items: _items,
  onItemSelect,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  sentinelRootMargin = "200px",
  ariaLabel = "Media results grid",
}: UseMediaGridOptions<T>): UseMediaGridResult<T> {
  const sentinelElementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const hasIntersectionObserver =
    typeof window !== "undefined" && "IntersectionObserver" in window;

  // Setup IntersectionObserver for automatic infinite scrolling
  useEffect(() => {
    if (!hasIntersectionObserver || !onLoadMore || !hasMore || isLoadingMore) {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      return;
    }

    const currentSentinel = sentinelElementRef.current;
    if (!currentSentinel) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore();
        }
      },
      { rootMargin: sentinelRootMargin }
    );

    observerRef.current.observe(currentSentinel);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [hasIntersectionObserver, onLoadMore, hasMore, isLoadingMore, sentinelRootMargin]);

  const sentinelRefCallback = useCallback((node: HTMLElement | null) => {
    sentinelElementRef.current = node;
  }, []);

  const getGridProps = useCallback(
    (): React.HTMLAttributes<HTMLDivElement> => ({
      role: "region",
      "aria-label": ariaLabel,
    }),
    [ariaLabel]
  );

  const getItemProps = useCallback(
    (
      item: T,
      index: number,
      additionalProps?: React.HTMLAttributes<HTMLElement>
    ) => {
      const handleClick: React.MouseEventHandler = (e) => {
        additionalProps?.onClick?.(e as React.MouseEvent<HTMLElement>);
        if (!e.defaultPrevented) {
          onItemSelect?.(item, index);
        }
      };

      const handleKeyDown: React.KeyboardEventHandler = (e) => {
        additionalProps?.onKeyDown?.(e as React.KeyboardEvent<HTMLElement>);
        if (!e.defaultPrevented && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onItemSelect?.(item, index);
        }
      };

      return {
        ...additionalProps,
        role: "button",
        tabIndex: 0,
        "aria-label": item.title ? `View ${item.title}` : `View media item ${index + 1}`,
        onClick: handleClick,
        onKeyDown: handleKeyDown,
      };
    },
    [onItemSelect]
  );

  const getSentinelProps = useCallback(
    () => ({
      ref: sentinelRefCallback,
      "aria-hidden": true,
    }),
    [sentinelRefCallback]
  );

  return {
    getGridProps,
    getItemProps,
    getSentinelProps,
    hasIntersectionObserver,
  };
}
