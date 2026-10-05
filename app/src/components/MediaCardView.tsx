import React from "react";
import { MediaItem } from "@headless-media/core";

export interface MediaCardViewProps {
  item: MediaItem;
  itemProps: React.HTMLAttributes<HTMLElement> & {
    role: string;
    tabIndex: number;
    onClick: React.MouseEventHandler;
    onKeyDown: React.KeyboardEventHandler;
  };
  onDownload: (item: MediaItem) => void;
}

export function MediaCardView({
  item,
  itemProps,
  onDownload,
}: MediaCardViewProps): React.JSX.Element {
  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening lightbox
    onDownload(item);
    window.open(item.downloadUrl || item.mediaUrl, "_blank", "noopener,noreferrer");
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening lightbox
  };

  return (
    <article {...itemProps} className="media-card">
      <div className="media-thumbnail-container">
        <img
          src={item.previewUrl}
          alt={item.title || "Media preview"}
          className="media-thumbnail"
          loading="lazy"
        />
        {item.type === "video" && (
          <span className="media-badge">
            🎬 {item.duration ? `${item.duration}s` : "Video"}
          </span>
        )}
      </div>

      <div className="media-card-body">
        <h3 className="media-card-title">{item.title}</h3>
        <div className="media-card-meta">
          <a
            href={item.author.url}
            target="_blank"
            rel="noreferrer"
            className="author-link"
            onClick={handleAuthorClick}
            aria-label={`Creator profile for ${item.author.name}`}
          >
            {item.author.name}
          </a>

          <button
            type="button"
            onClick={handleDownloadClick}
            className="btn btn-secondary"
            style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
            aria-label={`Download ${item.title}`}
          >
            ↓ Download
          </button>
        </div>
      </div>
    </article>
  );
}

