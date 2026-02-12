import { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Camera, Music, FileText, MessageSquare, Sparkles, Timer, Package, Mic, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Database } from "@/integrations/supabase/types";

type Offering = Database["public"]["Tables"]["offerings"]["Row"];
type OfferingType = Database["public"]["Enums"]["offering_type"];

interface Meeting {
  id: string;
  created_at: string;
  expires_at: string;
}

interface OfferingHistoryProps {
  offerings: Offering[];
  meetings: Meeting[];
}

const typeIcons: Record<OfferingType, React.ReactNode> = {
  photo: <Camera className="h-3 w-3" />,
  song: <Music className="h-3 w-3" />,
  poem: <FileText className="h-3 w-3" />,
  story: <MessageSquare className="h-3 w-3" />,
  nft: <Sparkles className="h-3 w-3" />,
  voice: <Mic className="h-3 w-3" />,
  book: <BookOpen className="h-3 w-3" />,
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getMeetingStatus(meeting: Meeting): "active" | "expired" {
  return new Date(meeting.expires_at).getTime() > Date.now() ? "active" : "expired";
}

const OfferingHistory = ({ offerings, meetings }: OfferingHistoryProps) => {
  const grouped = useMemo(() => {
    const meetingMap = new Map(meetings.map(m => [m.id, m]));
    const groups: { meeting: Meeting | null; offerings: Offering[] }[] = [];
    const byMeeting = new Map<string, Offering[]>();
    const unlinked: Offering[] = [];

    for (const o of offerings) {
      if (o.meeting_id && meetingMap.has(o.meeting_id)) {
        const arr = byMeeting.get(o.meeting_id) || [];
        arr.push(o);
        byMeeting.set(o.meeting_id, arr);
      } else {
        unlinked.push(o);
      }
    }

    // Sort meetings by created_at desc
    const sortedMeetings = [...byMeeting.entries()]
      .map(([mid, offs]) => ({ meeting: meetingMap.get(mid)!, offerings: offs }))
      .sort((a, b) => new Date(b.meeting.created_at).getTime() - new Date(a.meeting.created_at).getTime());

    groups.push(...sortedMeetings);
    if (unlinked.length > 0) groups.push({ meeting: null, offerings: unlinked });

    return groups;
  }, [offerings, meetings]);

  if (offerings.length === 0) {
    return (
      <Card className="border-border/40 bg-card/40 backdrop-blur">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground font-serif">No offerings yet. Meet this Ancient Friend to begin.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Accordion type="multiple" defaultValue={grouped.length > 0 ? [grouped[0].meeting?.id || "unlinked"] : []}>
        {grouped.map(({ meeting, offerings: groupOfferings }, idx) => {
          const key = meeting?.id || "unlinked";
          const status = meeting ? getMeetingStatus(meeting) : null;

          return (
            <AccordionItem key={key} value={key} className="border-border/30">
              <AccordionTrigger className="hover:no-underline py-3 gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {meeting ? (
                    <Timer className={`h-4 w-4 shrink-0 ${status === "active" ? "text-emerald-400" : "text-muted-foreground/50"}`} />
                  ) : (
                    <Package className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  )}
                  <div className="text-left min-w-0">
                    <p className="text-sm font-serif truncate">
                      {meeting
                        ? `Ritual Window — ${formatDate(meeting.created_at)}`
                        : "Unlinked Offerings"}
                    </p>
                    {meeting && (
                      <p className="text-[10px] text-muted-foreground/60 font-mono">
                        {formatTime(meeting.created_at)} → {formatTime(meeting.expires_at)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-auto shrink-0">
                    {status && (
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 ${
                          status === "active"
                            ? "border-emerald-500/40 text-emerald-400"
                            : "border-border/30 text-muted-foreground/50"
                        }`}
                      >
                        {status}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                      {groupOfferings.length} offering{groupOfferings.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <motion.div
                  className="space-y-2 pl-7"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                >
                  {groupOfferings
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((o) => (
                      <motion.div
                        key={o.id}
                        variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-3 py-1.5 px-3 rounded-md bg-secondary/20 border border-border/20"
                      >
                        <span className="text-primary/70">{typeIcons[o.type]}</span>
                        <span className="text-sm font-serif truncate flex-1">{o.title}</span>
                        <span className="text-[10px] text-muted-foreground/50 font-mono shrink-0">
                          {formatTime(o.created_at)}
                        </span>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border/30 capitalize">
                          {o.type}
                        </Badge>
                      </motion.div>
                    ))}
                </motion.div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default OfferingHistory;
