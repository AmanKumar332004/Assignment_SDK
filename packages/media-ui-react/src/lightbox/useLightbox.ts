import React, { useCallback, useEffect, useRef } from "react";

export interface UseLightboxOptions {
  isOpen: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  title?: string;
}

export interface UseLightboxResult {
  dialogRef: React.RefObject<HTMLDivElement>;
  getDialogProps: () => React.HTMLAttributes<HTMLDivElement> & {
    role: "dialog";
    "aria-modal": true;
    "aria-label": string;
    tabIndex: number;
    onKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
  };
  getBackdropProps: () => React.HTMLAttributes<HTMLDivElement> & {
    onClick: React.MouseEventHandler<HTMLDivElement>;
    "aria-hidden": true;
  };
  getCloseButtonProps: () => React.ButtonHTMLAttributes<HTMLButtonElement> & {
    type: "button";
    "aria-label": string;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
  };
  getPrevButtonProps: () => React.ButtonHTMLAttributes<HTMLButtonElement> & {
    type: "button";
    "aria-label": string;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    disabled: boolean;
  };
  getNextButtonProps: () => React.ButtonHTMLAttributes<HTMLButtonElement> & {
    type: "button";
    "aria-label": string;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    disabled: boolean;
  };
}

/**
 * Headless hook managing Lightbox modal semantics, keyboard navigation
 * (Escape, ArrowLeft, ArrowRight), and focus trapping & restoration.
 */
export function useLightbox({
  isOpen,
  onClose,
  onPrev,
  onNext,
  hasPrev = true,
  hasNext = true,
  title = "Media preview dialog",
}: UseLightboxOptions): UseLightboxResult {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Focus management: capture previous focus and move focus into dialog on open
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (isOpen) {
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

      // Small delay to allow element mounting before focusing
      const timer = setTimeout(() => {
        if (dialogRef.current) {
          const focusable = dialogRef.current.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable) {
            focusable.focus();
          } else {
            dialogRef.current.focus();
          }
        }
      }, 30);

      return () => clearTimeout(timer);
    } else {
      // Restore focus on close
      if (previouslyFocusedElementRef.current && typeof previouslyFocusedElementRef.current.focus === "function") {
        previouslyFocusedElementRef.current.focus();
      }
    }
  }, [isOpen]);

  // Keyboard navigation & Focus Trap
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "ArrowLeft" && onPrev && hasPrev) {
        e.preventDefault();
        e.stopPropagation();
        onPrev();
        return;
      }

      if (e.key === "ArrowRight" && onNext && hasNext) {
        e.preventDefault();
        e.stopPropagation();
        onNext();
        return;
      }

      // Focus trap for Tab key
      if (e.key === "Tab" && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    },
    [onClose, onPrev, onNext, hasPrev, hasNext]
  );

  const getDialogProps = useCallback(
    () => ({
      ref: dialogRef,
      role: "dialog" as const,
      "aria-modal": true as const,
      "aria-label": title,
      tabIndex: -1,
      onKeyDown: handleKeyDown,
    }),
    [title, handleKeyDown]
  );

  const getBackdropProps = useCallback(
    () => ({
      onClick: (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      },
      "aria-hidden": true as const,
    }),
    [onClose]
  );

  const getCloseButtonProps = useCallback(
    () => ({
      type: "button" as const,
      "aria-label": "Close dialog",
      onClick: onClose,
    }),
    [onClose]
  );

  const getPrevButtonProps = useCallback(
    () => ({
      type: "button" as const,
      "aria-label": "Previous item",
      onClick: () => {
        if (hasPrev && onPrev) onPrev();
      },
      disabled: !hasPrev,
    }),
    [hasPrev, onPrev]
  );

  const getNextButtonProps = useCallback(
    () => ({
      type: "button" as const,
      "aria-label": "Next item",
      onClick: () => {
        if (hasNext && onNext) onNext();
      },
      disabled: !hasNext,
    }),
    [hasNext, onNext]
  );

  return {
    dialogRef,
    getDialogProps,
    getBackdropProps,
    getCloseButtonProps,
    getPrevButtonProps,
    getNextButtonProps,
  };
}
