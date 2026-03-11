/**
 * useTeotagPageContext — lightweight hook that pages call to feed
 * contextual data into the TEOTAG intelligence layer.
 *
 * Usage:
 *   useTeotagPageContext({ tree: { id: tree.id, name: tree.name, species: tree.species } });
 *   useTeotagPageContext({ harvest: { id: listing.id, produceName: listing.produce_name } });
 */
import { useEffect, useRef } from "react";
import { useTeotagContext, type PageContext } from "@/contexts/TeotagContext";

export function useTeotagPageContext(ctx: Partial<PageContext>) {
  const { setPageContext, clearPageContext } = useTeotagContext();
  const serialised = JSON.stringify(ctx);
  const prevRef = useRef<string>();

  useEffect(() => {
    // Only update if context actually changed
    if (prevRef.current === serialised) return;
    prevRef.current = serialised;
    setPageContext(ctx);

    return () => {
      clearPageContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialised]);
}
