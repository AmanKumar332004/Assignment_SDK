---
name: wiring-media-data
description: Practical runbook and API reference for integrating the @headless-media/core SDK and @headless-media/react adapter hooks in React applications.
---

# Wiring Media Data Skill

This skill guides AI coding agents and frontend engineers on configuring, instantiating, and consuming the headless media data layer using `@headless-media/core` and `@headless-media/react`.

---

## 1. Architectural Boundaries

- **`@headless-media/core`**: Framework-independent pure TypeScript SDK. It manages network communication, Pexels API normalization, in-memory caching with request deduplication, and activity event emitting. It **never** imports React, DOM elements, or UI components.
- **`@headless-media/react`**: Thin React adapter. Provides `<MediaProvider>` context and ergonomic hooks (`useMediaSearch`, `useCuratedMedia`, `useMediaItem`, `useMediaActivity`). It **never** re-implements API fetching or caching algorithms.
- **UI Independence**: UI packages and presentations do not communicate directly with Pexels; they consume normalized `MediaItem` models and callback actions provided by this data layer.

---

## 2. Client Initialization & Configuration

### Security Rules
- **Never hard-code an API key in code.**
- Read the key from `import.meta.env.VITE_PEXELS_API_KEY` (or backend proxy in production).
- Browser Warning: Any client-side key in a web application is visible to end users via network inspect tools. For production enterprise deployments, route requests through a server-side proxy to protect private credentials.

### Code Example: Initializing `MediaClient`

```tsx
import { createMediaClient, MediaClient } from "@headless-media/core";
import { MediaProvider } from "@headless-media/react";
import React, { useMemo } from "react";

export function AppRoot({ children }: { children: React.ReactNode }) {
  const client = useMemo<MediaClient>(() => {
    const apiKey = import.meta.env.VITE_PEXELS_API_KEY || "";
    
    return createMediaClient({
      apiKey,
      cacheTtlMs: 5 * 60 * 1000, // 5 minutes TTL
      enableConsoleLogging: true, // safe console logger (no keys leaked)
    });
  }, []);

  return <MediaProvider client={client}>{children}</MediaProvider>;
}
```

---

## 3. Hook APIs & Data Consumption

### 3.1 Searching Media (`useMediaSearch`)
Used when a user submits or types a search query.

```tsx
import React, { useState } from "react";
import { useMediaSearch } from "@headless-media/react";

export function SearchResultsView() {
  const [query, setQuery] = useState("nature");

  const {
    items,          // MediaItem[]: normalized photos or videos
    isLoading,      // boolean: initial load
    isLoadingMore,  // boolean: subsequent page load
    error,          // MediaError | Error | null: structured error
    hasMore,        // boolean: whether another page exists
    totalResults,   // number: total items found on Pexels
    loadMore,       // () => Promise<void>: fetches next page
    refresh,        // () => Promise<void>: re-executes page 1
  } = useMediaSearch({
    query,
    type: "photo",  // "photo" | "video"
    perPage: 15,
    autoFetch: true,
  });

  if (isLoading && items.length === 0) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <p>Found {totalResults} items</p>
      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.title}</li>
        ))}
      </ul>
      {hasMore && (
        <button onClick={loadMore} disabled={isLoadingMore}>
          {isLoadingMore ? "Loading more..." : "Load More"}
        </button>
      )}
    </div>
  );
}
```

### 3.2 Curated / Trending Media (`useCuratedMedia`)
Used for initial discovery dashboards or empty query states.

```tsx
import { useCuratedMedia } from "@headless-media/react";

export function CuratedFeed() {
  const { items, isLoading, hasMore, loadMore } = useCuratedMedia({
    type: "video", // "photo" | "video"
    perPage: 12,
  });

  return (/* render items */);
}
```

### 3.3 Activity Event Subscriptions (`useMediaActivity`)
Used to subscribe to `view` and `download` events and dispatch activity from user interactions. Subscriptions are automatically cleaned up when the component unmounts.

```tsx
import React, { useState } from "react";
import { MediaActivityEvent } from "@headless-media/core";
import { useMediaActivity } from "@headless-media/react";

export function ActivityMonitor() {
  const [recentEvents, setRecentEvents] = useState<MediaActivityEvent[]>([]);

  // Subscribes listener with automatic unmount cleanup
  const { recordView, recordDownload } = useMediaActivity((event) => {
    setRecentEvents((prev) => [event, ...prev.slice(0, 19)]);
  });

  return (
    <div>
      <h3>Live Activity Log</h3>
      {recentEvents.map((evt, idx) => (
        <div key={idx}>
          [{evt.type}] {evt.item.title} at {new Date(evt.timestamp).toLocaleTimeString()}
        </div>
      ))}
    </div>
  );
}
```

---

## 4. Common Pitfalls & Mistakes to Avoid

1. **Forgetting `<MediaProvider>`**:
   Calling `useMediaSearch()` outside of `<MediaProvider>` throws a clear descriptive error. Always mount the provider near your application root.
2. **Re-creating `MediaClient` on every render**:
   Wrap `createMediaClient` inside `useMemo(..., [])` to keep the client reference stable and retain the in-memory cache and in-flight deduplicator.
3. **Leaking API keys in logs or URLs**:
   Never include `apiKey` in error output, query parameters visible to users, or committed configuration files.
4. **Ignoring unmount cleanup**:
   Always use the cleanup callback returned by `client.activity.subscribe` or use `useMediaActivity`, which handles this automatically.

