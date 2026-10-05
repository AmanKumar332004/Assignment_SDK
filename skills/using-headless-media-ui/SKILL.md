---
name: using-headless-media-ui
description: Practical runbook and API reference for using @headless-media/ui-react headless components and hooks (Grid, Lightbox, ReelSwiper).
---

# Using Headless Media UI Skill

This skill guides AI coding agents and frontend engineers on implementing accessible, unstyled media interfaces using `@headless-media/ui-react`.

---

## 1. Architectural Independence

- **Zero Data Layer Knowledge**: `@headless-media/ui-react` **never** imports `@headless-media/core`, `@headless-media/react`, or any Pexels SDK code.
- **Zero Dictated Styling**: It ships **zero** CSS for layouts, colors, typography, borders, or animations.
- **Contract by Props**: The components and hooks receive raw data, loading states, and callback handlers strictly via props.
- **Generic Item Interface**: Operates on `HeadlessMediaItem` (`{ id, previewUrl, mediaUrl?, title?, ... }`). Any data structure satisfying this shape (such as `MediaItem`) is accepted.

---

## 2. Component & Hook APIs

### 2.1 Media Grid (`MediaGrid` & `useMediaGrid`)
Provides responsive grid interaction, keyboard accessibility (`Enter`/`Space`), and automatic infinite-scroll via `IntersectionObserver` with fallback.

#### Using the `useMediaGrid` Hook (Prop-Getter Approach)
```tsx
import { useMediaGrid } from "@headless-media/ui-react";
import React from "react";

export function CustomGrid({ items, onSelect, onLoadMore, hasMore, isLoadingMore }) {
  const { getGridProps, getItemProps, getSentinelProps } = useMediaGrid({
    items,
    onItemSelect: onSelect,
    onLoadMore,
    hasMore,
    isLoadingMore,
    ariaLabel: "Photos search results",
  });

  return (
    <div {...getGridProps()} className="my-css-grid">
      {items.map((item, index) => {
        // getItemProps returns role="button", tabIndex=0, onClick, onKeyDown, aria-label
        const itemProps = getItemProps(item, index);
        return (
          <div key={item.id} {...itemProps} className="my-card">
            <img src={item.previewUrl} alt={item.title || "Photo"} />
            <h3>{item.title}</h3>
          </div>
        );
      })}

      {/* Invisible sentinel element observed by IntersectionObserver */}
      {hasMore && <div {...getSentinelProps()} style={{ height: "1px" }} />}
    </div>
  );
}
```

#### Using the Declarative `<MediaGrid>` Component
```tsx
import { MediaGrid } from "@headless-media/ui-react";

<MediaGrid
  items={items}
  onItemSelect={(item, index) => openLightbox(index)}
  onLoadMore={loadMore}
  hasMore={hasMore}
  isLoadingMore={isLoadingMore}
  className="my-grid-class"
  renderItem={(item, itemProps, index) => (
    <article {...itemProps} className="my-card-class">
      <img src={item.previewUrl} alt={item.title} />
      <span>{item.title}</span>
    </article>
  )}
  renderEmpty={() => <p>No media found.</p>}
/>
```

---

### 2.2 Lightbox Modal (`Lightbox` & `useLightbox`)
Provides an accessible modal preview with:
- `role="dialog"` and `aria-modal="true"`.
- Keyboard navigation: <kbd>Escape</kbd> to close, <kbd>←</kbd> / <kbd>→</kbd> for prev/next.
- **Focus Management**: Traps <kbd>Tab</kbd> focus inside the dialog while open; restores focus to the previously active element upon closing.

```tsx
import { Lightbox } from "@headless-media/ui-react";

<Lightbox
  isOpen={isOpen}
  item={activeItem}
  onClose={() => setIsOpen(false)}
  onPrev={() => setIndex(prev => prev - 1)}
  onNext={() => setIndex(prev => prev + 1)}
  hasPrev={index > 0}
  hasNext={index < items.length - 1}
  className="my-lightbox-dialog"
  backdropClassName="my-backdrop"
  renderContent={({ item, closeProps, prevProps, nextProps }) => (
    <div className="lightbox-wrapper">
      <header>
        <h2>{item.title}</h2>
        <button {...closeProps}>Close</button>
      </header>

      <main>
        <button {...prevProps}>Previous</button>
        {item.type === "video" ? (
          <video src={item.mediaUrl} controls autoPlay />
        ) : (
          <img src={item.mediaUrl || item.previewUrl} alt={item.title} />
        )}
        <button {...nextProps}>Next</button>
      </main>
    </div>
  )}
/>
```

---

### 2.3 Reel Swiper (`ReelSwiper` & `useReelSwiper`)
Provides a vertical snap carousel for video reels:
- Keyboard navigation: <kbd>↓</kbd> / <kbd>PageDown</kbd> (next), <kbd>↑</kbd> / <kbd>PageUp</kbd> (prev).
- Touch swipe gesture detection (swipe up/down).
- Mouse wheel scroll page detection with debounce lock.
- Emits `onActiveChange(activeItem, index)` for video play/pause and analytics.

```tsx
import { ReelSwiper } from "@headless-media/ui-react";

<ReelSwiper
  items={videoItems}
  onActiveChange={(activeItem, index) => {
    console.log("Active reel:", activeItem.id);
  }}
  className="my-reels-container"
  renderItem={({ item, index, isActive, slideProps, goToNext, goToPrev }) => (
    <section {...slideProps} className={`reel-slide ${isActive ? "active" : ""}`}>
      <video src={item.mediaUrl} poster={item.previewUrl} controls playsInline />
      <div className="overlay">
        <h3>{item.title}</h3>
        <button onClick={goToNext}>Next Reel ↓</button>
      </div>
    </section>
  )}
  renderEmpty={() => <p>No video reels available.</p>}
/>
```

---

## 3. Accessibility Contracts Summary

Feature | Contract Implemented
:--- | :---
**Grid Items** | Sets `role="button"`, `tabIndex={0}`, accessible `aria-label`, handles `Enter` and `Space` keyboard activation.
**Infinite Scroll** | Isolates `IntersectionObserver` with fallback check so absence of browser observer never crashes.
**Lightbox Dialog** | Sets `role="dialog"`, `aria-modal="true"`, captures initial focus on open, traps `Tab` cycles, listens for `Escape`, and restores focus upon exit.
**Reel Carousel** | Sets `role="region"`, `aria-roledescription="carousel"`, slide `role="group"` with `aria-roledescription="slide"` and `aria-current`.

