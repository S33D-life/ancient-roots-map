import { useEffect, useRef } from "react";

/** Keep the checked-in deck's return doorway inside the surrounding app journey. */
export default function EmbeddedCouncilDeck({ src, onReturn }: { src: string; onReturn: () => void }) {
  const detach = useRef<(() => void) | undefined>();
  useEffect(() => () => detach.current?.(), []);
  return <iframe src={src} title="TETOL Council of Life spatial deck" allow="fullscreen" allowFullScreen onLoad={event => {
    detach.current?.();
    const doc = event.currentTarget.contentDocument;
    if (!doc) return;
    const handleClick = (click: MouseEvent) => {
      // Do not redirect other deck links, new-tab gestures or unrelated destinations.
      if (click.button !== 0 || click.ctrlKey || click.metaKey || click.shiftKey || click.altKey) return;
      const target = click.target;
      if (!target || !(target as Element).closest) return;
      const link = (target as Element).closest<HTMLAnchorElement>("a#council-return");
      if (!link) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== "/council-of-life" || url.searchParams.get("from") !== "spatial-council") return;
      click.preventDefault();
      onReturn();
    };
    doc.addEventListener("click", handleClick);
    detach.current = () => doc.removeEventListener("click", handleClick);
  }} />;
}
