/**
 * QuestRewardRow — compact reward summary for a quest card.
 *
 * Renders a single line such as:
 *   "+99 prepared · Spring Pilgrim Branch · Rooted"
 *   "+33 S33D · +33 Oak Hearts · Oak Hive · Rooted"
 *
 * Pure presentational; no claiming logic.
 */
import { Sparkles } from "lucide-react";
import type { QuestRewardFlow } from "./rewardTypes";
import { VERIFICATION_COPY } from "./rewardTypes";

interface Props {
  reward?: QuestRewardFlow;
  /** Quest is complete — softens "prepared" wording to "earned" visually. */
  bloomed?: boolean;
}

export default function QuestRewardRow({ reward, bloomed }: Props) {
  if (!reward) return null;

  const parts: string[] = [];
  const verb = bloomed ? "earned" : "prepared";

  if (reward.bonusHearts && !reward.speciesHearts && !reward.hearthHearts && !reward.circleHearts) {
    parts.push(`+${reward.bonusHearts} ${verb}`);
  } else if (reward.bonusHearts) {
    parts.push(`+${reward.bonusHearts} S33D`);
  }
  if (reward.speciesHearts) {
    parts.push(`+${reward.speciesHearts.amount} ${reward.speciesHearts.species} Hearts`);
  }
  if (reward.hearthHearts) {
    parts.push(`+${reward.hearthHearts} Hearth`);
  }
  if (reward.circleHearts) {
    parts.push(`+${reward.circleHearts} Circle`);
  }
  if (reward.valueTreeBranch) {
    parts.push(reward.valueTreeBranch);
  }
  if (reward.verificationLevel) {
    parts.push(reward.verificationLevel);
  }

  if (parts.length === 0) return null;

  const tooltip = reward.verificationLevel
    ? VERIFICATION_COPY[reward.verificationLevel]
    : undefined;

  return (
    <p
      className="text-[10px] font-serif text-muted-foreground/80 leading-relaxed flex items-center gap-1 flex-wrap"
      title={tooltip}
    >
      <Sparkles className="w-2.5 h-2.5 text-primary/60 shrink-0" aria-hidden />
      {parts.map((p, i) => (
        <span key={i} className="inline-flex items-center">
          {i > 0 && <span className="mx-1 text-muted-foreground/40">·</span>}
          <span>{p}</span>
        </span>
      ))}
    </p>
  );
}
