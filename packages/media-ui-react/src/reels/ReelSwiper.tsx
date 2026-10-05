import React from "react";
import { HeadlessMediaItem } from "../types.js";
import { useReelSwiper, UseReelSwiperOptions } from "./useReelSwiper.js";

export interface ReelSwiperProps<T extends HeadlessMediaItem = HeadlessMediaItem>
  extends UseReelSwiperOptions<T> {
  className?: string;
  style?: React.CSSProperties;
  renderEmpty?: () => React.ReactNode;
  renderItem: (props: {
    item: T;
    index: number;
    isActive: boolean;
    slideProps: React.HTMLAttributes<HTMLDivElement> & {
      role: "group";
      "aria-roledescription": "slide";
      "aria-label": string;
      "aria-current": boolean | undefined;
      "aria-hidden": boolean;
    };
    goToNext: () => void;
    goToPrev: () => void;
  }) => React.ReactNode;
  renderControls?: (props: {
    activeIndex: number;
    total: number;
    goToNext: () => void;
    goToPrev: () => void;
    goTo: (index: number) => void;
  }) => React.ReactNode;
}

/**
 * Headless ReelSwiper component.
 * Manages vertical snap carousels with zero visual styling.
 */
export function ReelSwiper<T extends HeadlessMediaItem = HeadlessMediaItem>({
  items,
  initialIndex = 0,
  onActiveChange,
  loop = false,
  className,
  style,
  renderEmpty,
  renderItem,
  renderControls,
}: ReelSwiperProps<T>): React.JSX.Element {
  const {
    activeIndex,
    goTo,
    goToNext,
    goToPrev,
    getContainerProps,
    getSlideProps,
  } = useReelSwiper({
    items,
    initialIndex,
    onActiveChange,
    loop,
  });

  if (items.length === 0) {
    if (renderEmpty) {
      return <>{renderEmpty()}</>;
    }
    return (
      <div role="status" aria-label="No media reels available">
        <p>No video reels available to display.</p>
      </div>
    );
  }

  return (
    <div {...getContainerProps()} className={className} style={style}>
      {items.map((item, index) => {
        const slideProps = getSlideProps(item, index);
        const isActive = index === activeIndex;

        return (
          <React.Fragment key={item.id ?? index}>
            {renderItem({
              item,
              index,
              isActive,
              slideProps,
              goToNext,
              goToPrev,
            })}
          </React.Fragment>
        );
      })}

      {renderControls &&
        renderControls({
          activeIndex,
          total: items.length,
          goToNext,
          goToPrev,
          goTo,
        })}
    </div>
  );
}
