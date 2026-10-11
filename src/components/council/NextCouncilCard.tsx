import { useState, type Ref } from "react";
import { CIRCLE_235_DOORWAY as circle } from "@/data/council/circle235Doorway";
import { COMPANION_READING_235 } from "@/data/council/companionReading";
import { approvedCircleUrl } from "../../../supabase/functions/_shared/currentCircle";

interface NextCouncilCardProps {
  onJoinCouncil: () => void; refreshKey?: number; onEditCouncil?: () => void;
  onMeetCompanion?: (node: string) => void; doorwayRef?: Ref<HTMLButtonElement>; deckAvailable?: boolean;
}
export default function NextCouncilCard({ onJoinCouncil, onMeetCompanion, doorwayRef, deckAvailable = !!approvedCircleUrl(circle.links.councilDeck) }: NextCouncilCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  // Fail closed for unapproved or another Circle; never carry 235 appearances into a future week.
  if (circle.approval !== "approved") return null;
  const reading = selected && circle.number === 235 ? COMPANION_READING_235[selected] : undefined;
  const groupUrl = approvedCircleUrl(circle.links.group);
  return <article className="parchment-current-circle canopy-current-circle">
    <span className="canopy-week"><span className="canopy-week-title">{circle.title} · </span><span className="canopy-week-number">Circle {circle.number} · </span><span>{circle.weekState}</span></span>
    <h2 className="canopy-question">{circle.question}</h2>
    <p className="canopy-open">The live fires come and go; the Circle does not close. Come in your own time.</p>
    <div className="canopy-gathered"><h3>{circle.companionsLabel}</h3>
      <div className="canopy-companions" aria-label="Gathered companions">{circle.companions.map(name => <button key={name} type="button" aria-pressed={selected === name} aria-controls="companion-reading" onClick={() => setSelected(selected === name ? null : name)}>{name}</button>)}</div>
      {selected && <div id="companion-reading" className="canopy-companion-reading" aria-live="polite"><h4>{selected}</h4><p>{reading?.line || "A companion gathered in this Circle."}</p>{reading && onMeetCompanion && deckAvailable && <button type="button" className="parchment-action" onClick={() => onMeetCompanion(reading.node)}>Follow this companion in the Circle →</button>}{selected === "Fly Agaric" && <p className="parchment-safety">{circle.safety}</p>}</div>}
    </div>
    <p className="canopy-open-seat">People · an open place for you.<span className="sr-only"> {circle.peopleSeat}</span></p>
    <p className="canopy-fire">{circle.openLine} {groupUrl && <a href={groupUrl} target="_blank" rel="noopener noreferrer">Fire times in the Council group ↗</a>}</p>
    {deckAvailable && <button ref={doorwayRef} type="button" className="parchment-action canopy-enter" aria-controls="council-deck-preview" onClick={onJoinCouncil}>Enter the Circle →</button>}
    <p className="parchment-safety">{circle.safetyLabel}: {circle.safety}</p>
  </article>;
}
