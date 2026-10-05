import React, { useEffect, useRef } from "react";
import { MediaItem } from "@headless-media/core";
import { ReelSwiper } from "@headless-media/ui-react";

export interface AppReelsViewProps {
  items: MediaItem[];
  onRecordView: (item: MediaItem) => void;
  onRecordDownload: (item: MediaItem) => void;
}

export function AppReelsView({
  items,
  onRecordView,
  onRecordDownload,
}: AppReelsViewProps): React.JSX.Element {
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());

  // Record view of initial reel
  useEffect(() => {
    if (items.length > 0 && items[0]) {
      onRecordView(items[0]);
    }
  }, [items, onRecordView]);

  const handleActiveChange = (activeItem: MediaItem, index: number) => {
    onRecordView(activeItem);

    // Play active video, pause others
    videoRefs.current.forEach((videoEl, idx) => {
      if (idx === index) {
        videoEl.play().catch(() => {
          // Autoplay policy fallback: muted autoplay
          videoEl.muted = true;
          videoEl.play().catch(() => {});
        });
      } else {
        videoEl.pause();
      }
    });
  };

  const handleDownload = (item: MediaItem) => {
    onRecordDownload(item);
    window.open(item.downloadUrl || item.mediaUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
      <div style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
        💡 <strong>Reel Controls</strong>: Use <kbd>↑</kbd> / <kbd>↓</kbd> Arrow keys, mouse wheel, or touch swipe
        to scroll reels.
      </div>

      <ReelSwiper<MediaItem>
        items={items}
        onActiveChange={handleActiveChange}
        className="reels-container"
        renderItem={({ item, index, isActive, slideProps, goToNext, goToPrev }) => (
          <div
            {...slideProps}
            className="reel-slide"
            style={{ display: isActive ? "flex" : "none" }}
          >
            <video
              ref={(el) => {
                if (el) videoRefs.current.set(index, el);
                else videoRefs.current.delete(index);
              }}
              src={item.mediaUrl}
              poster={item.previewUrl}
              playsInline
              loop
              controls
              className="reel-video"
            />

            <div className="reel-overlay">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>{item.title}</h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>By {item.author.name}</span>
                <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                  Reel {index + 1} of {items.length}
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => handleDownload(item)}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: "0.4rem" }}
                >
                  ↓ Download MP4
                </button>
                <button
                  type="button"
                  onClick={goToPrev}
                  disabled={index === 0}
                  className="btn btn-secondary"
                  aria-label="Previous reel"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  disabled={index === items.length - 1}
                  className="btn btn-secondary"
                  aria-label="Next reel"
                >
                  ↓
                </button>
              </div>
            </div>
          </div>
        )}
        renderControls={({ activeIndex, total, goToNext, goToPrev }) => (
          <div className="reel-nav-controls">
            <button
              type="button"
              onClick={goToPrev}
              disabled={activeIndex === 0}
              className="btn btn-secondary"
            >
              ↑ Previous Reel
            </button>
            <span style={{ display: "flex", alignItems: "center", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              {activeIndex + 1} / {total}
            </span>
            <button
              type="button"
              onClick={goToNext}
              disabled={activeIndex === total - 1}
              className="btn btn-secondary"
            >
              ↓ Next Reel
            </button>
          </div>
        )}
      />
    </div>
  );
}
