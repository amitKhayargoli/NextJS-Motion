// hooks/useKeyboardShortcut.ts
import { useEffect } from "react";

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  } = {},
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const {
        ctrl = false,
        shift = false,
        alt = false,
        meta = false,
      } = options;

      const isMatch =
        event.key.toLowerCase() === key.toLowerCase() &&
        event.ctrlKey === ctrl &&
        event.shiftKey === shift &&
        event.altKey === alt &&
        event.metaKey === meta;

      if (isMatch) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, callback, options]);
}
