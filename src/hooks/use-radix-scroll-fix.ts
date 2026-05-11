import { useEffect } from "react";

/**
 * Restores body scroll if a Radix modal (Sheet/Dialog with modal=true) unmounts
 * while still open. Radix sets `overflow:hidden` and `padding-right` on
 * `document.body` and only cleans them up on its own close cycle.
 */
export function useRadixScrollFix() {
  useEffect(() => {
    return () => {
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("padding-right");
    };
  }, []);
}
