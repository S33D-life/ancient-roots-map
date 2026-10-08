/** Heartwood Hall uses the shared Living Parchment entrance. */
import { useDocumentTitle } from "@/hooks/use-document-title";
import HeartwoodLanding from "@/components/library/HeartwoodLanding";

export default function GalleryPage() {
  useDocumentTitle("Heartwood Hall");
  return <HeartwoodLanding />;
}
