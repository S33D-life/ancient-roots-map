import { CIRCLE_235_DOORWAY as circle } from "@/data/council/circle235Doorway";

interface NextCouncilCardProps {
  onJoinCouncil: () => void; refreshKey?: number; onEditCouncil?: () => void;
}

export default function NextCouncilCard({ onJoinCouncil }: NextCouncilCardProps) {
  return <article className="parchment-current-circle">
    <span className="parchment-kicker">{circle.weekState}</span>
    <h3>{circle.title}</h3>
    <p>{circle.openLine}</p>
    <p className="italic">{circle.question}</p>
    <p>{circle.companionsLabel}: {circle.companions.join(" · ")}. {circle.peopleSeat}</p>
    <p className="parchment-safety">{circle.safetyLabel}: {circle.safety}</p>
    <nav aria-label="Current Circle doorways"><button type="button" className="parchment-action" onClick={onJoinCouncil}>Join the 2D Council →</button><a href={circle.tetolUrl} target="_blank" rel="noopener noreferrer" className="parchment-action">Explore Circle {circle.number} in 3D TETOL<span aria-hidden="true"> →</span></a><a href={circle.groupUrl} target="_blank" rel="noopener noreferrer" className="parchment-action">Council group · Fire times →</a></nav>
    <p className="parchment-safety">Different places. Different moments. One living Council.</p>
  </article>;
}
