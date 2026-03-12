import { Map, Users, Image, BarChart3, TreePine } from "lucide-react";
import type { CompanionCommand, CompanionRoom } from "@/lib/companion-types";
import { cn } from "@/lib/utils";
import { hapticTap } from "@/lib/haptics";

interface RoomNavProps {
  currentRoom: CompanionRoom;
  send: (cmd: CompanionCommand) => void;
}

const rooms: { id: CompanionRoom; label: string; icon: typeof Map }[] = [
  { id: "map", label: "Map", icon: Map },
  { id: "staff", label: "Staff", icon: Users },
  { id: "gallery", label: "Gallery", icon: Image },
  { id: "ledger", label: "Ledger", icon: BarChart3 },
  { id: "tree", label: "Tree", icon: TreePine },
];

export default function RoomNav({ currentRoom, send }: RoomNavProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-2 px-3 border-b border-border/20">
      {rooms.map(({ id, label, icon: Icon }) => {
        const active = currentRoom === id;
        return (
          <button
            key={id}
            onClick={() => {
              hapticTap();
              send({ type: "navigate_room", room: id });
            }}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[10px] font-serif transition-all min-w-[44px] min-h-[44px] justify-center",
              active
                ? "bg-primary/15 text-primary border border-primary/25"
                : "text-muted-foreground hover:bg-secondary/30 border border-transparent",
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
