import { useParchmentDark } from "@/hooks/use-parchment-dark";
import S33dLegacyIntro from "./S33dLegacyIntro";
export default function Index() {
  const dark = useParchmentDark();
  return <S33dLegacyIntro parchment={!dark} />;
}
