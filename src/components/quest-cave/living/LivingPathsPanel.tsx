/**
 * LivingPathsPanel — the new ceremonial progression layer for Quest Cave.
 * Adds quiet sections: Species Path, Hive Paths, Ancient Friends,
 * Seasonal Wanderings, Offerings, Ancient Paths.
 */
import { useMemo } from "react";
import LivingSection from "./LivingSection";
import ProgressionSeal from "./ProgressionSeal";
import QuietQuestRow from "./QuietQuestRow";
import {
  ANCIENT_PATHS,
  ANCIENT_QUESTS,
  HIVES,
  HIVE_MILESTONES,
  OFFERING_QUESTS,
  SEASONAL_QUESTS,
  SPECIES_MILESTONES,
  STAFF_RESONANCE,
  currentSeason,
  nextMilestone,
  reachedMilestones,
} from "@/lib/quest-cave/livingPaths";
import { useLivingProgression } from "@/hooks/use-living-progression";
import { useBorrowedStaff } from "@/hooks/use-borrowed-staff";
import type { QuestCaveActivity } from "@/hooks/use-quest-cave-activity";

interface Props {
  userId: string | null;
  activity: QuestCaveActivity;
}

export default function LivingPathsPanel({ userId, activity }: Props) {
  const progression = useLivingProgression(userId);
  const { staff } = useBorrowedStaff();

  const speciesCount = progression.speciesEncountered.length;
  const speciesNext = nextMilestone(speciesCount, SPECIES_MILESTONES) as number;
  const reachedSpecies = useMemo(
    () => reachedMilestones(speciesCount, SPECIES_MILESTONES),
    [speciesCount],
  );

  const season = currentSeason();

  const offeringTotal = activity.offerings + activity.blooms + activity.whispersSent;
  const resonanceLine = staff
    ? STAFF_RESONANCE[(staff.archetype_species ?? "").toLowerCase()]
    : undefined;

  return (
    <div className="space-y-3">
      {/* 1. Species Path */}
      <LivingSection
        title="Species Path"
        subtitle="Tree species encountered through your wanderings."
        trailing={
          <ProgressionSeal
            current={speciesCount}
            target={speciesNext}
            sealLabel="Species"
            size={56}
          />
        }
      >
        {!userId ? (
          <SignInWhisper />
        ) : speciesCount === 0 ? (
          <EmptyWhisper line="When you visit your first tree, this path begins." />
        ) : (
          <>
            <p className="font-serif text-sm text-foreground/90">
              {speciesCount} species met beneath the changing canopy.
            </p>
            {progression.recentSpecies.length > 0 && (
              <p className="font-serif text-[11px] text-muted-foreground/80 italic">
                Recently:{" "}
                {progression.recentSpecies.slice(0, 5).map((s, i) => (
                  <span key={s}>
                    {i > 0 && " · "}
                    <span>{s}</span>
                  </span>
                ))}
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {SPECIES_MILESTONES.map((m) => {
                const reached = reachedSpecies.includes(m);
                return (
                  <div
                    key={m.count}
                    className={`rounded-lg border p-2 text-center ${
                      reached
                        ? "border-primary/40 bg-primary/10"
                        : "border-border/30 bg-card/40 opacity-70"
                    }`}
                  >
                    <p className="font-serif text-sm text-foreground">{m.count}</p>
                    <p className="font-serif text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70 mt-0.5">
                      {m.seal}
                    </p>
                  </div>
                );
              })}
            </div>
            {reachedSpecies.length > 0 && (
              <p className="font-serif text-[11px] italic text-muted-foreground/80">
                {reachedSpecies[reachedSpecies.length - 1].whisper}
              </p>
            )}
          </>
        )}
      </LivingSection>

      {/* 2. Hive Paths */}
      <LivingSection
        title="Hive Paths"
        subtitle="Lineage-paths through species you have met often."
      >
        {!userId ? (
          <SignInWhisper />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {HIVES.map((h) => {
              const count = progression.hiveCounts[h.id] ?? 0;
              const next = (HIVE_MILESTONES.find((n) => count < n) ?? HIVE_MILESTONES.at(-1)!) as number;
              return (
                <div
                  key={h.id}
                  className={`rounded-xl border border-border/30 bg-gradient-to-br ${h.toneClass} p-3 flex items-center gap-3`}
                >
                  <ProgressionSeal current={count} target={next} size={56} centerText={`${count}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-sm text-foreground">{h.label}</p>
                    <p className="font-serif text-[11px] italic text-muted-foreground/80 leading-snug">
                      {h.blurb}
                    </p>
                    <p className="font-serif text-[10px] text-muted-foreground/70 mt-1">
                      You have met {count} · next seal at {next}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </LivingSection>

      {/* 3. Ancient Friends */}
      <LivingSection
        title="Ancient Friends"
        subtitle="Elders met. Some trees remember more than maps do."
        toneClass="from-amber-100/40 via-card/60 to-amber-50/30 dark:from-amber-950/15 dark:to-amber-950/10"
        trailing={
          <ProgressionSeal current={progression.ancientCount} target={12} size={56} sealLabel="Elders" />
        }
      >
        {!userId ? (
          <SignInWhisper />
        ) : (
          <>
            <p className="font-serif text-sm text-foreground/90">
              {progression.ancientCount} elder
              {progression.ancientCount === 1 ? "" : "s"} met across {progression.regionCount}{" "}
              region{progression.regionCount === 1 ? "" : "s"}.
            </p>
            <p className="font-serif text-[11px] italic text-muted-foreground/70">
              Elders here are estimated at 200 years or more.
            </p>
            <div className="space-y-2 pt-1">
              {ANCIENT_QUESTS.map((q) => {
                const c =
                  q.id === "ancient-3" || q.id === "ancient-12"
                    ? progression.ancientCount
                    : q.id === "regions-3"
                      ? progression.regionCount
                      : undefined;
                return (
                  <QuietQuestRow
                    key={q.id}
                    title={q.title}
                    description={q.description}
                    current={c}
                    target={q.target}
                    group={q.group}
                  />
                );
              })}
            </div>
          </>
        )}
      </LivingSection>

      {/* 4. Seasonal Wanderings */}
      <LivingSection
        title="Seasonal Wanderings"
        subtitle={`Active this season — ${season}.`}
        toneClass="from-emerald-50/40 via-card/60 to-amber-50/30 dark:from-emerald-950/10 dark:to-amber-950/10"
      >
        <p className="font-serif text-sm text-foreground/90">
          {progression.seasonalVisits} visit{progression.seasonalVisits === 1 ? "" : "s"} this {season.toLowerCase()}.
        </p>
        <div className="space-y-2 pt-1">
          {SEASONAL_QUESTS.map((q) => (
            <QuietQuestRow
              key={q.id}
              title={q.title}
              description={q.description}
              current={q.id === "trees-in-bloom" ? activity.blooms : undefined}
              target={q.target}
            />
          ))}
        </div>
      </LivingSection>

      {/* 5. Offerings */}
      <LivingSection
        title="Offerings"
        subtitle="Quiet acts of contribution, remembrance, and care."
      >
        {!userId ? (
          <SignInWhisper />
        ) : (
          <>
            <p className="font-serif text-sm text-foreground/90">
              {offeringTotal} offering{offeringTotal === 1 ? "" : "s"} carried into the canopy so far.
            </p>
            <div className="space-y-2 pt-1">
              {OFFERING_QUESTS.map((q) => (
                <QuietQuestRow
                  key={q.id}
                  title={q.title}
                  description={q.description}
                  current={q.id === "offer-3" ? activity.offerings : undefined}
                  target={q.target}
                  complete={q.id === "send-whisper" ? activity.whispersSent > 0 : undefined}
                />
              ))}
            </div>
            <p className="font-serif text-[11px] italic text-muted-foreground/70 pt-1">
              Soon, songs, books, poems, and memories will also travel as whispers
              through the Ancient Friends roots.
            </p>
          </>
        )}
      </LivingSection>

      {/* 6. Ancient Paths */}
      <LivingSection
        title="Ancient Paths"
        subtitle="Some trees remember the roads before maps."
        defaultOpen={false}
        toneClass="from-amber-50/40 via-card/60 to-stone-100/40 dark:from-amber-950/10 dark:to-stone-900/20"
      >
        <p className="font-serif text-[11px] italic text-muted-foreground/80">
          Path inference is still being woven. For now, these routes wait quietly for footsteps.
        </p>
        <div className="space-y-2 pt-1">
          {ANCIENT_PATHS.map((q) => (
            <QuietQuestRow key={q.id} title={q.title} description={q.description} group={q.group} />
          ))}
        </div>
      </LivingSection>

      {/* 7. Borrowed Staff Resonance */}
      {resonanceLine && (
        <div className="rounded-2xl border border-amber-900/20 bg-card/40 p-4">
          <p className="font-serif text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">
            Borrowed Staff resonance
          </p>
          <p className="font-serif text-sm italic text-foreground/90 mt-1">{resonanceLine}</p>
        </div>
      )}
    </div>
  );
}

function SignInWhisper() {
  return (
    <p className="font-serif text-[11px] italic text-muted-foreground/80">
      Sign in to let the path remember your steps.
    </p>
  );
}

function EmptyWhisper({ line }: { line: string }) {
  return <p className="font-serif text-[11px] italic text-muted-foreground/80">{line}</p>;
}
