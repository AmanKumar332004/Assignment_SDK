/**
 * Typed activity event emitter for @headless-media/core.
 * Tracks user activity (view, download) without polluting UI components.
 */

import { MediaItem } from "./types.js";

export type MediaActivityType = "view" | "download";

export interface MediaActivityEvent {
  type: MediaActivityType;
  item: MediaItem;
  timestamp: number;
}

export type MediaActivityListener = (event: MediaActivityEvent) => void;

export class MediaEventEmitter {
  private listeners = new Set<MediaActivityListener>();
  private consoleListener: MediaActivityListener | null = null;

  constructor(enableConsole = false) {
    if (enableConsole) {
      this.enableConsoleLogging();
    }
  }

  /**
   * Subscribes a listener to media activity events.
   * Returns an unsubscribe cleanup function.
   */
  public subscribe(listener: MediaActivityListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.unsubscribe(listener);
    };
  }

  /**
   * Unsubscribes a listener.
   */
  public unsubscribe(listener: MediaActivityListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Emits an activity event to all active subscribers.
   */
  public emit(event: MediaActivityEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        // Prevent one faulty listener from crashing other listeners
        console.error("Error in MediaActivityListener:", err);
      }
    }
  }

  /**
   * Convenience method to emit a 'view' event for a media item.
   */
  public recordView(item: MediaItem): void {
    this.emit({
      type: "view",
      item,
      timestamp: Date.now(),
    });
  }

  /**
   * Convenience method to emit a 'download' event for a media item.
   */
  public recordDownload(item: MediaItem): void {
    this.emit({
      type: "download",
      item,
      timestamp: Date.now(),
    });
  }

  /**
   * Enables a clean console activity logger that safely logs events
   * without exposing API keys or request headers.
   */
  public enableConsoleLogging(): void {
    if (this.consoleListener) return;

    this.consoleListener = (event) => {
      const timeStr = new Date(event.timestamp).toLocaleTimeString();
      console.log(
        `%c[Media Activity] %c${event.type.toUpperCase()}%c: "${event.item.title || "Untitled"}" (id: ${event.item.id}, ${event.item.type}) by ${event.item.author.name} at ${timeStr}`,
        "color: #3b82f6; font-weight: bold;",
        event.type === "download" ? "color: #10b981; font-weight: bold;" : "color: #8b5cf6; font-weight: bold;",
        "color: inherit;"
      );
    };

    this.listeners.add(this.consoleListener);
  }

  /**
   * Disables the console activity logger.
   */
  public disableConsoleLogging(): void {
    if (this.consoleListener) {
      this.listeners.delete(this.consoleListener);
      this.consoleListener = null;
    }
  }

  public get listenerCount(): number {
    return this.listeners.size;
  }
}

