/**
 * GalleryPage — Now serves as the Heartwood Library entrance hall only.
 * Individual rooms are handled by HeartwoodRoomPage at /library/:room.
 */
import { useEntranceOnce } from "@/hooks/use-entrance-once";
import { useDocumentTitle } from "@/hooks/use-document-title";
import LevelEntrance from "@/components/LevelEntrance";
import HeartwoodLanding from "@/components/library/HeartwoodLanding";
import heartwoodLanding from "@/assets/hearth-cave.png";

const GalleryPage = () => {
  const { showEntrance: showSplash, dismissEntrance: dismissSplash } = useEntranceOnce("gallery", true);

  if (showSplash) {
    return (
      <LevelEntrance
        phases={[{ src: heartwoodLanding, alt: "The Heartwood Library" }]}
        phaseDuration={1200}
        fadeDuration={600}
        onComplete={() => dismissSplash()}
      />
    );
  }

  return <HeartwoodLanding />;
};

export default GalleryPage;
