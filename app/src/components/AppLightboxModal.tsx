import React, { useEffect } from "react";
import { MediaItem } from "@headless-media/core";
import { Lightbox } from "@headless-media/ui-react";

export interface AppLightboxModalProps {
  isOpen: boolean;
  item: MediaItem | null;
  items: MediaItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  onRecordView: (item: MediaItem) => void;
  onRecordDownload: (item: MediaItem) => void;
}

export function AppLightboxModal({
  isOpen,
  item,
  items,
  currentIndex,
  onClose,
  onNavigate,
  onRecordView,
  onRecordDownload,
}: AppLightboxModalProps): React.JSX.Element | null {
  // Record view activity whenever lightbox opens or active item changes
  useEffect(() => {
    if (isOpen && item) {
      onRecordView(item);
    }
  }, [isOpen, item, onRecordView]);

  if (!isOpen || !item) {
    return null;
  }

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  const handlePrev = () => {
    if (hasPrev) onNavigate(currentIndex - 1);
  };

  const handleNext = () => {
    if (hasNext) onNavigate(currentIndex + 1);
  };

  const handleDownload = () => {
    onRecordDownload(item);
    window.open(item.downloadUrl || item.mediaUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Lightbox<MediaItem>
      isOpen={isOpen}
      item={item}
      onClose={onClose}
      onPrev={handlePrev}
      onNext={handleNext}
      hasPrev={hasPrev}
      hasNext={hasNext}
      backdropClassName="lightbox-backdrop"
      className="lightbox-dialog"
      renderContent={({ item: activeItem, closeProps, prevProps, nextProps }) => (
        <>
          <div className="lightbox-header">
            <h2 className="lightbox-title">{activeItem.title || "Media Preview"}</h2>
            <button {...closeProps} className="btn btn-ghost" style={{ fontSize: "1.2rem", padding: "0.2rem 0.6rem" }}>
              ✕
            </button>
          </div>

          <div className="lightbox-content-area">
            {hasPrev && (
              <button {...prevProps} className="lightbox-nav-btn lightbox-prev">
                ‹
              </button>
            )}

            {activeItem.type === "video" ? (
              <video
                src={activeItem.mediaUrl}
                poster={activeItem.previewUrl}
                controls
                autoPlay
                className="lightbox-media"
              />
            ) : (
              <img
                src={activeItem.mediaUrl || activeItem.previewUrl}
                alt={activeItem.title || "Full photo preview"}
                className="lightbox-media"
              />
            )}

            {hasNext && (
              <button {...nextProps} className="lightbox-nav-btn lightbox-next">
                ›
              </button>
            )}
          </div>

          <div className="lightbox-footer">
            <div>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                Created by{" "}
              </span>
              <a
                href={activeItem.author.url}
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--accent-color)", fontWeight: 600, fontSize: "0.85rem" }}
              >
                {activeItem.author.name}
              </a>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginLeft: "1rem" }}>
                ({currentIndex + 1} of {items.length})
              </span>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={handleDownload}
                className="btn btn-primary"
                style={{ fontSize: "0.85rem" }}
              >
                ↓ Download High-Res
              </button>
            </div>
          </div>
        </>
      )}
    />
  );
}
