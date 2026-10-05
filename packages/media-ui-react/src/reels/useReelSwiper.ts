import React, { useCallback, useEffect, useRef, useState } from "react";
import { HeadlessMediaItem } from "../types.js";

export interface UseReelSwiperOptions<T extends HeadlessMediaItem = HeadlessMediaItem> {
  items: T[];
  initialIndex?: number;
  onActiveChange?: (activeItem: T, index: number) => void;
  loop?: boolean;
}

export interface UseReelSwiperResult<T extends HeadlessMediaItem = HeadlessMediaItem> {
  activeIndex: number;
  activeItem: T | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  goTo: (index: number) => void;
  goToNext: () => void;
  goToPrev: () => void;
  getContainerProps: (
    additionalProps?: React.HTMLAttributes<HTMLDivElement>
  ) => React.HTMLAttributes<HTMLDivElement> & {
    role: "region";
    "aria-roledescription": "carousel";
    "aria-label": string;
    tabIndex: number;
    onKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
    onTouchStart: React.TouchEventHandler<HTMLDivElement>;
    onTouchEnd: React.TouchEventHandler<HTMLDivElement>;
    onWheel: React.WheelEventHandler<HTMLDivElement>;
  };
  getSlideProps: (
    item: T,
    index: number,
    additionalProps?: React.HTMLAttributes<HTMLDivElement>
  ) => React.HTMLAttributes<HTMLDivElement> & {
    role: "group";
    "aria-roledescription": "slide";
    "aria-label": string;
    "aria-current": boolean | undefined;
    "aria-hidden": boolean;
  };
}

/**
 * Headless hook managing vertical reel swiper navigation, keyboard accessibility,
 * touch gestures, and mouse wheel paging.
 */
export function useReelSwiper<T extends HeadlessMediaItem = HeadlessMediaItem>({
  items,
  initialIndex = 0,
  onActiveChange,
  loop = false,
}: UseReelSwiperOptions<T>): UseReelSwiperResult<T> {
  const [activeIndex, setActiveIndex] = useState<number>(() =>
    items.length > 0 ? Math.min(Math.max(0, initialIndex), items.length - 1) : 0
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isWheelLockedRef = useRef<boolean>(false);

  // Sync index if items length changes
  useEffect(() => {
    if (items.length === 0) {
      setActiveIndex(0);
    } else if (activeIndex >= items.length) {
      setActiveIndex(items.length - 1);
    }
  }, [items.length, activeIndex]);

  const activeItem = items[activeIndex] ?? null;

  const goTo = useCallback(
    (index: number) => {
      if (items.length === 0) return;

      let target = index;
      if (target < 0) {
        target = loop ? items.length - 1 : 0;
      } else if (target >= items.length) {
        target = loop ? 0 : items.length - 1;
      }

      setActiveIndex(target);
      const nextItem = items[target];
      if (nextItem) {
        onActiveChange?.(nextItem, target);
      }
    },
    [items, loop, onActiveChange]
  );

  const goToNext = useCallback(() => {
    goTo(activeIndex + 1);
  }, [goTo, activeIndex]);

  const goToPrev = useCallback(() => {
    goTo(activeIndex - 1);
  }, [goTo, activeIndex]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goTo(items.length - 1);
      }
    },
    [goToNext, goToPrev, goTo, items.length]
  );

  // Touch swipe gesture detection
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    touchStartYRef.current = e.touches[0]?.clientY ?? null;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (touchStartYRef.current === null) return;
      const touchEndY = e.changedTouches[0]?.clientY;
      if (touchEndY === undefined) return;

      const diffY = touchStartYRef.current - touchEndY;
      const minSwipeDistance = 45;

      if (diffY > minSwipeDistance) {
        goToNext();
      } else if (diffY < -minSwipeDistance) {
        goToPrev();
      }

      touchStartYRef.current = null;
    },
    [goToNext, goToPrev]
  );

  // Wheel handling with debounce lock
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (isWheelLockedRef.current) return;
      if (Math.abs(e.deltaY) < 25) return;

      isWheelLockedRef.current = true;
      if (e.deltaY > 0) {
        goToNext();
      } else {
        goToPrev();
      }

      setTimeout(() => {
        isWheelLockedRef.current = false;
      }, 350);
    },
    [goToNext, goToPrev]
  );

  const getContainerProps = useCallback(
    (additionalProps?: React.HTMLAttributes<HTMLDivElement>) => ({
      ...additionalProps,
      ref: containerRef,
      role: "region" as const,
      "aria-roledescription": "carousel" as const,
      "aria-label": "Vertical media reels",
      tabIndex: 0,
      onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
        additionalProps?.onKeyDown?.(e);
        if (!e.defaultPrevented) {
          handleKeyDown(e);
        }
      },
      onTouchStart: (e: React.TouchEvent<HTMLDivElement>) => {
        additionalProps?.onTouchStart?.(e);
        handleTouchStart(e);
      },
      onTouchEnd: (e: React.TouchEvent<HTMLDivElement>) => {
        additionalProps?.onTouchEnd?.(e);
        handleTouchEnd(e);
      },
      onWheel: (e: React.WheelEvent<HTMLDivElement>) => {
        additionalProps?.onWheel?.(e);
        handleWheel(e);
      },
    }),
    [handleKeyDown, handleTouchStart, handleTouchEnd, handleWheel]
  );

  const getSlideProps = useCallback(
    (item: T, index: number, additionalProps?: React.HTMLAttributes<HTMLDivElement>) => {
      const isCurrent = index === activeIndex;
      return {
        ...additionalProps,
        role: "group" as const,
        "aria-roledescription": "slide" as const,
        "aria-label": `Reel ${index + 1} of ${items.length}: ${item.title || "Media"}`,
        "aria-current": isCurrent ? true : undefined,
        "aria-hidden": !isCurrent,
      };
    },
    [activeIndex, items.length]
  );

  return {
    activeIndex,
    activeItem,
    containerRef,
    goTo,
    goToNext,
    goToPrev,
    getContainerProps,
    getSlideProps,
  };
}

