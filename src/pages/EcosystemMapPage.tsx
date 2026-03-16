import TetolEcosystemMap from "@/components/ecosystem/TetolEcosystemMap";
import { useDocumentTitle } from "@/hooks/use-document-title";

export default function EcosystemMapPage() {
  useDocumentTitle("Ecosystem Map");
  return <TetolEcosystemMap />;
}
