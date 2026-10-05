import React from "react";
import { HeadlessMediaItem } from "../types.js";
import { useLightbox, UseLightboxOptions } from "./useLightbox.js";

export interface LightboxProps<T extends HeadlessMediaItem = HeadlessMediaItem>
  extends UseLightboxOptions {
  item: T | null;
  className?: string;
  backdropClassName?: string;
  style?: React.CSSProperties;
  backdropStyle?: React.CSSProperties;
  renderContent?: (props: {
    item: T;
    closeProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
    prevProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
    nextProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
  }) => React.ReactNode;
}

/**
 * Headless Lightbox component.
 * Renders dialog semantics and accessible controls with zero visual styling.
 */
export function Lightbox<T extends HeadlessMediaItem = HeadlessMediaItem>({
  isOpen,
  item,
  onClose,
  onPrev,
  onNext,
  hasPrev = true,
  hasNext = true,
  title,
  className,
  backdropClassName,
  style,
  backdropStyle,
  renderContent,
}: LightboxProps<T>): React.JSX.Element | null {
  const {
    getDialogProps,
    getBackdropProps,
    getCloseButtonProps,
    getPrevButtonProps,
    getNextButtonProps,
  } = useLightbox({
    isOpen,
    onClose,
    onPrev,
    onNext,
    hasPrev,
    hasNext,
    title: title || (item?.title ? `Preview: ${item.title}` : "Media lightbox"),
  });

  if (!isOpen || !item) {
    return null;
  }

  const closeProps = getCloseButtonProps();
  const prevProps = getPrevButtonProps();
  const nextProps = getNextButtonProps();

  return (
    <div {...getBackdropProps()} className={backdropClassName} style={backdropStyle}>
      <div {...getDialogProps()} className={className} style={style}>
        {renderContent ? (
          renderContent({ item, closeProps, prevProps, nextProps })
        ) : (
          <div>
            <button {...closeProps}>✕</button>
            {hasPrev && <button {...prevProps}>←</button>}
            {hasNext && <button {...nextProps}>→</button>}
            {item.type === "video" ? (
              <video src={item.mediaUrl} controls autoPlay />
            ) : (
              <img src={item.mediaUrl || item.previewUrl} alt={item.title || "Preview"} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
