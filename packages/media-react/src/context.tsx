import React, { createContext, useContext, useMemo } from "react";
import { MediaClient } from "@headless-media/core";

export interface MediaProviderProps {
  /**
   * The MediaClient instance to provide to child components.
   */
  client: MediaClient;
  children: React.ReactNode;
}

const MediaContext = createContext<MediaClient | null>(null);

/**
 * React Context Provider for the headless MediaClient.
 * Establishes the data layer instance across the React component tree.
 */
export function MediaProvider({ client, children }: MediaProviderProps): React.JSX.Element {
  const value = useMemo(() => client, [client]);

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
}

/**
 * Accesses the MediaClient instance from the nearest MediaProvider.
 * Throws a helpful error if called outside of a MediaProvider tree.
 */
export function useMediaClient(): MediaClient {
  const client = useContext(MediaContext);
  if (!client) {
    throw new Error(
      "useMediaClient was called outside of a <MediaProvider>. Please wrap your application or component tree in <MediaProvider client={mediaClient}>."
    );
  }
  return client;
}

