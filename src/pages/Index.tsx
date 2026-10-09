import { useParchmentDark } from "@/hooks/use-parchment-dark";
import S33dLegacyIntro from "./S33dLegacyIntro";
import S33dParchmentIntro from "./S33dParchmentIntro";
export default function Index() {
  const dark = useParchmentDark();
  return dark ? <S33dLegacyIntro /> : <S33dParchmentIntro />;
}
