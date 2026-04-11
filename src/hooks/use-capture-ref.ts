/**
 * useCaptureRef — captures ?ref=username from the URL on any page load.
 * Stores it in localStorage so it persists through navigation and signup.
 * Mount once in the app root.
 */
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function useCaptureRef() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("s33d_ref", ref);
    }
  }, [searchParams]);
}
