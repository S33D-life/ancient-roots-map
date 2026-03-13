import { useCompanionBridge } from "@/hooks/use-companion-bridge";

/**
 * Invisible component that wires companion commands to actual desktop actions.
 * Must be rendered inside BrowserRouter + CompanionProvider.
 */
export default function CompanionBridge() {
  useCompanionBridge();
  return null;
}
