import React from "react";
import { MediaActivityEvent } from "@headless-media/core";

export interface ActivityDrawerProps {
  isOpen: boolean;
  events: MediaActivityEvent[];
  onClose: () => void;
  onClear: () => void;
}

export function ActivityDrawer({
  isOpen,
  events,
  onClose,
  onClear,
}: ActivityDrawerProps): React.JSX.Element | null {
  if (!isOpen) return null;

  return (
    <aside
      className="activity-drawer"
      role="complementary"
      aria-label="Real-time media activity log"
    >
      <div className="activity-header">
        <span>Activity Log ({events.length})</span>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {events.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="btn btn-ghost"
              style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
            aria-label="Close activity log"
          >
            ✕
          </button>
        </div>
      </div>

      <ul className="activity-list">
        {events.length === 0 ? (
          <li style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.8rem", textAlign: "center" }}>
            No activity yet. Click a photo/video card, open a lightbox, swipe reels, or click Download to see events.
          </li>
        ) : (
          events.map((evt, idx) => (
            <li
              key={`${evt.timestamp}-${idx}`}
              className={`activity-item ${evt.type}`}
            >
              <div className="activity-item-top">
                <span className={`activity-type-tag ${evt.type}`}>{evt.type}</span>
                <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
              </div>
              <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                {evt.item.title || "Untitled Media"}
              </div>
              <div style={{ color: "var(--text-secondary)" }}>
                ID: {evt.item.id} • by {evt.item.author.name}
              </div>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}

