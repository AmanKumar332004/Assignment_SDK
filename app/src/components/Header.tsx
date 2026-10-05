import React, { useState } from "react";
import { MediaType } from "@headless-media/core";

export interface HeaderProps {
  query: string;
  mediaType: MediaType;
  viewMode: "grid" | "reels";
  activityCount: number;
  isActivityDrawerOpen: boolean;
  onSearch: (newQuery: string) => void;
  onMediaTypeChange: (type: MediaType) => void;
  onViewModeChange: (mode: "grid" | "reels") => void;
  onToggleActivityDrawer: () => void;
}

export function Header({
  query,
  mediaType,
  viewMode,
  activityCount,
  isActivityDrawerOpen,
  onSearch,
  onMediaTypeChange,
  onViewModeChange,
  onToggleActivityDrawer,
}: HeaderProps): React.JSX.Element {
  const [searchInput, setSearchInput] = useState(query);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput.trim());
  };

  return (
    <header className="app-header">
      <div className="header-top">
        <div className="logo-area">
          <span className="logo-badge">Headless</span>
          <h1 className="app-title">Media Explorer</h1>
        </div>

        <form onSubmit={handleSubmit} className="search-form" role="search">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={`Search ${mediaType === "photo" ? "photos" : "videos"} on Pexels...`}
            className="search-input"
            aria-label="Search media query"
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        <div className="header-actions">
          <button
            type="button"
            onClick={onToggleActivityDrawer}
            className={`btn btn-secondary ${isActivityDrawerOpen ? "active" : ""}`}
            aria-label="Toggle activity stream"
          >
            <span>Activity Log</span>
            {activityCount > 0 && <span className="activity-badge">{activityCount}</span>}
          </button>
        </div>
      </div>

      <nav className="controls-bar" aria-label="Media controls and views">
        {/* Media Type Tabs */}
        <div className="filter-group" role="tablist" aria-label="Media type selection">
          <button
            type="button"
            role="tab"
            aria-selected={mediaType === "photo"}
            className={`filter-tab ${mediaType === "photo" ? "active" : ""}`}
            onClick={() => onMediaTypeChange("photo")}
          >
            📷 Photos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mediaType === "video"}
            className={`filter-tab ${mediaType === "video" ? "active" : ""}`}
            onClick={() => onMediaTypeChange("video")}
          >
            🎬 Videos
          </button>
        </div>

        {/* View mode toggle (Grid vs Reels) */}
        {mediaType === "video" && (
          <div className="filter-group" role="group" aria-label="Video presentation mode">
            <button
              type="button"
              className={`filter-tab ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => onViewModeChange("grid")}
            >
              ⊞ Grid View
            </button>
            <button
              type="button"
              className={`filter-tab ${viewMode === "reels" ? "active" : ""}`}
              onClick={() => onViewModeChange("reels")}
            >
              📱 Reels View
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}

