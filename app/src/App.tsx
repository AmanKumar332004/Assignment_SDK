import React, { useMemo, useState } from "react";
import {
  createMediaClient,
  MediaActivityEvent,
  MediaClient,
  MediaItem,
  MediaType,
} from "@headless-media/core";
import {
  MediaProvider,
  useCuratedMedia,
  useMediaActivity,
  useMediaSearch,
} from "@headless-media/react";
import { MediaGrid } from "@headless-media/ui-react";
import { Header } from "./components/Header.js";
import { ApiKeyNotice } from "./components/ApiKeyNotice.js";
import { ActivityDrawer } from "./components/ActivityDrawer.js";
import { MediaCardView } from "./components/MediaCardView.js";
import { AppLightboxModal } from "./components/AppLightboxModal.js";
import { AppReelsView } from "./components/AppReelsView.js";

function MediaExplorerContent({
  apiKey,
  onSetTempKey,
}: {
  apiKey: string;
  onSetTempKey: (key: string) => void;
}) {
  const [query, setQuery] = useState<string>("");
  const [mediaType, setMediaType] = useState<MediaType>("photo");
  const [viewMode, setViewMode] = useState<"grid" | "reels">("grid");
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState<boolean>(false);
  const [activityEvents, setActivityEvents] = useState<MediaActivityEvent[]>([]);

  // Wire activity event tracking from media-core
  const { recordView, recordDownload } = useMediaActivity((event) => {
    setActivityEvents((prev) => [event, ...prev.slice(0, 49)]); // keep last 50 events
  });

  // Use search if query provided; otherwise display curated/trending media
  const isSearchActive = query.trim().length > 0;

  const searchData = useMediaSearch({
    query,
    type: mediaType,
    autoFetch: isSearchActive,
  });

  const curatedData = useCuratedMedia({
    type: mediaType,
    autoFetch: !isSearchActive,
  });

  const activeData = isSearchActive ? searchData : curatedData;
  const { items, isLoading, isLoadingMore, error, hasMore, loadMore } = activeData;

  const handleItemSelect = (item: MediaItem, index: number) => {
    setSelectedItemIndex(index);
    recordView(item);
  };

  const selectedItem =
    selectedItemIndex !== null && items[selectedItemIndex] ? items[selectedItemIndex] : null;

  return (
    <div className="app-container">
      <Header
        query={query}
        mediaType={mediaType}
        viewMode={viewMode}
        activityCount={activityEvents.length}
        isActivityDrawerOpen={isActivityDrawerOpen}
        onSearch={(newQuery) => {
          setQuery(newQuery);
          setSelectedItemIndex(null);
        }}
        onMediaTypeChange={(newType) => {
          setMediaType(newType);
          setSelectedItemIndex(null);
        }}
        onViewModeChange={(newMode) => {
          setViewMode(newMode);
          setSelectedItemIndex(null);
        }}
        onToggleActivityDrawer={() => setIsActivityDrawerOpen((prev) => !prev)}
      />

      <main className="main-content">
        <ApiKeyNotice apiKey={apiKey} onSetTempKey={onSetTempKey} />

        {/* Section title */}
        <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700 }}>
              {isSearchActive
                ? `Results for "${query}" (${mediaType === "photo" ? "Photos" : "Videos"})`
                : `Curated ${mediaType === "photo" ? "Photos" : "Popular Videos"}`}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              {items.length > 0 ? `Showing ${items.length} items` : ""}
            </p>
          </div>
        </div>

        {/* Loading state for initial fetch */}
        {isLoading && items.length === 0 && (
          <div className="state-container">
            <div className="spinner" />
            <p style={{ color: "var(--text-secondary)" }}>
              Fetching {mediaType}s from Pexels API...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="state-container">
            <div className="error-box">
              <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>API Error Encountered</h3>
              <p>{error.message}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && items.length === 0 && (
          <div className="state-container">
            <div style={{ fontSize: "3rem" }}>🔍</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 600 }}>No media found</h3>
            <p style={{ color: "var(--text-secondary)", maxWidth: "400px" }}>
              {isSearchActive
                ? `We couldn't find any ${mediaType}s matching "${query}". Try searching for nature, city, people, or architecture.`
                : "No items returned. Please verify your Pexels API key."}
            </p>
          </div>
        )}

        {/* Video Reels View */}
        {mediaType === "video" && viewMode === "reels" && items.length > 0 && (
          <AppReelsView
            items={items}
            onRecordView={recordView}
            onRecordDownload={recordDownload}
          />
        )}

        {/* Grid View (Photos or Videos) */}
        {(mediaType === "photo" || viewMode === "grid") && items.length > 0 && (
          <>
            <MediaGrid<MediaItem>
              items={items}
              onItemSelect={handleItemSelect}
              onLoadMore={loadMore}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              className="media-grid"
              renderItem={(item, itemProps) => (
                <MediaCardView
                  item={item}
                  itemProps={itemProps}
                  onDownload={recordDownload}
                />
              )}
            />

            {/* Load More Fallback / Status */}
            <div className="load-more-container">
              {isLoadingMore ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div className="spinner" style={{ width: "24px", height: "24px" }} />
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                    Loading more {mediaType}s...
                  </span>
                </div>
              ) : hasMore ? (
                <button
                  type="button"
                  onClick={loadMore}
                  className="btn btn-secondary"
                  aria-label="Load more media items"
                >
                  Load More {mediaType === "photo" ? "Photos" : "Videos"}
                </button>
              ) : (
                <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  End of results
                </span>
              )}
            </div>
          </>
        )}
      </main>

      {/* Headless Lightbox Modal */}
      <AppLightboxModal
        isOpen={selectedItemIndex !== null}
        item={selectedItem}
        items={items}
        currentIndex={selectedItemIndex ?? 0}
        onClose={() => setSelectedItemIndex(null)}
        onNavigate={(newIndex) => setSelectedItemIndex(newIndex)}
        onRecordView={recordView}
        onRecordDownload={recordDownload}
      />

      {/* Real-time Activity Log Drawer */}
      <ActivityDrawer
        isOpen={isActivityDrawerOpen}
        events={activityEvents}
        onClose={() => setIsActivityDrawerOpen(false)}
        onClear={() => setActivityEvents([])}
      />
    </div>
  );
}

export function App(): React.JSX.Element {
  // Read API key from Vite environment variable or session fallback
  const [sessionKey, setSessionKey] = useState<string>(() => {
    return (
      (typeof sessionStorage !== "undefined" && sessionStorage.getItem("pexels_key")) ||
      import.meta.env.VITE_PEXELS_API_KEY ||
      ""
    );
  });

  const handleSetSessionKey = (key: string) => {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("pexels_key", key);
    }
    setSessionKey(key);
  };

  const client = useMemo<MediaClient>(() => {
    const validKey = sessionKey.trim() || "unconfigured_key";
    return createMediaClient({
      apiKey: validKey,
      enableConsoleLogging: true,
    });
  }, [sessionKey]);

  return (
    <MediaProvider client={client}>
      <MediaExplorerContent apiKey={sessionKey} onSetTempKey={handleSetSessionKey} />
    </MediaProvider>
  );
}

export default App;
