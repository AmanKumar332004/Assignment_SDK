import React from "react";
import { HeadlessMediaItem } from "../types.js";
import { useMediaGrid, UseMediaGridOptions } from "./useMediaGrid.js";

export interface MediaGridProps<T extends HeadlessMediaItem = HeadlessMediaItem>
  extends UseMediaGridOptions<T> {
  className?: string;
  style?: React.CSSProperties;
  itemClassName?: string;
  renderItem: (
    item: T,
    itemProps: React.HTMLAttributes<HTMLElement> & {
      role: string;
      tabIndex: number;
      onClick: React.MouseEventHandler;
      onKeyDown: React.KeyboardEventHandler;
    },
    index: number
  ) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderLoadMore?: (props: {
    onLoadMore: () => void;
    hasMore: boolean;
    isLoadingMore: boolean;
  }) => React.ReactNode;
}

/**
 * Headless MediaGrid component.
 * Renders zero default CSS styles, leaving all styling to the consumer.
 */
export function MediaGrid<T extends HeadlessMediaItem = HeadlessMediaItem>({
  items,
  renderItem,
  renderEmpty,
  renderLoadMore,
  onItemSelect,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  className,
  style,
  ariaLabel,
}: MediaGridProps<T>): React.JSX.Element {
  const { getGridProps, getItemProps, getSentinelProps } = useMediaGrid({
    items,
    onItemSelect,
    onLoadMore,
    hasMore,
    isLoadingMore,
    ariaLabel,
  });

  if (items.length === 0 && renderEmpty) {
    return <>{renderEmpty()}</>;
  }

  return (
    <div {...getGridProps()} className={className} style={style}>
      {items.map((item, index) => {
        const itemProps = getItemProps(item, index);
        return (
          <React.Fragment key={item.id ?? index}>
            {renderItem(item, itemProps, index)}
          </React.Fragment>
        );
      })}

      {/* Intersection sentinel */}
      {hasMore && <div {...getSentinelProps()} style={{ height: "1px", width: "100%" }} />}

      {/* Optional fallback button slot for load more */}
      {renderLoadMore &&
        onLoadMore &&
        renderLoadMore({
          onLoadMore,
          hasMore,
          isLoadingMore,
        })}
    </div>
  );
}

