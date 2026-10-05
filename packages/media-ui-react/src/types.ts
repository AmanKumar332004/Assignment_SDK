import React from "react";

/**
 * Generic media item interface for headless UI components.
 * Independent of media-core and any API schema.
 */
export interface HeadlessMediaItem {
  id: string;
  type?: string;
  title?: string;
  previewUrl: string;
  mediaUrl?: string;
  downloadUrl?: string;
  aspectRatio?: number;
  width?: number;
  height?: number;
}

/**
 * Common prop-getter return type extending standard HTML element attributes.
 */
export type DOMProps<T = HTMLElement> = React.HTMLAttributes<T> & {
  ref?: React.Ref<T>;
};
