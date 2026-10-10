import { Link } from "react-router-dom";
import { BookOpen, Music, ScrollText } from "lucide-react";
import { ROOM_BY_KEY, ACCESS_LEVEL_BY_KEY } from "@/config/heartwoodRooms";
import { ROUTES } from "@/lib/routes";
import TreeSpine from "./TreeSpine";
import TrunkChamberDoor from "./TrunkChamberDoor";
import AnatomicalSeam from "./AnatomicalSeam";
import "./exterior-study.css";

const origin = { from: "/s33d#heartwood", hallOrigin: "/s33d#heartwood" };

/** A local crop of existing SVG material, never a new scene or room registry. */
export function ExteriorMaterial({ region }: { region: "heartwood" | "roots" }) {
  return <div className={`exterior-material exterior-material-${region}`} aria-hidden="true">
    <TreeSpine opacity={0.45} />
    <AnatomicalSeam variant={region === "heartwood" ? "canopy-trunk" : "ground-roots"} />
  </div>;
}

export default function ExteriorHeartwood() {
  return <section id="heartwood" className="exterior-heartwood-study">
    <ExteriorMaterial region="heartwood" />
    <div className="exterior-heartwood-heading">
      <span className="parchment-kicker">Heartwood · the Trunk</span>
      <h2>The Tree remembers.</h2>
      <p>The magical home of what we have lived together.</p>
    </div>
    <div className="exterior-room-openings" aria-label="Doorways glimpsed in Heartwood">
      {(["music-room", "scrolls"] as const).map((key) => {
        const room = ROOM_BY_KEY[key];
        return <div key={key} className={`exterior-room-opening exterior-room-${key}`}>
          <TrunkChamberDoor icon={key === "music-room" ? Music : ScrollText}
            title={room.label} description={room.access === "visitor" ? room.subtitle ?? "" : `${ACCESS_LEVEL_BY_KEY[room.access].label} access · permissions apply`}
            to={room.route} state={origin} tempH={key === "music-room" ? 128 : 38} />
        </div>;
      })}
    </div>
    <div className="exterior-hall-threshold">
      <BookOpen size={24} aria-hidden="true" />
      <Link to={ROUTES.LIBRARY} state={origin}>Enter Heartwood Hall →</Link>
      <p>Consult Heartwood. Find a room, a record, a living relationship.</p>
    </div>
  </section>;
}
