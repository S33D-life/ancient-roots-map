import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CouncilInvitationDetails } from "@/lib/moonroot/types";

interface Props {
  value: CouncilInvitationDetails;
  onChange: (next: CouncilInvitationDetails) => void;
}

export default function CouncilInvitationFields({ value, onChange }: Props) {
  const set = (k: keyof CouncilInvitationDetails) => (e: any) =>
    onChange({ ...value, [k]: e.target.value });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label className="font-serif text-sm">Council title</Label>
        <Input value={value.title} onChange={set("title")} placeholder="Council of the Elder Oak" />
      </div>
      <div className="space-y-1.5">
        <Label className="font-serif text-sm">Moon phase</Label>
        <Input value={value.moonPhase} onChange={set("moonPhase")} placeholder="New Moon / Full Moon" />
      </div>
      <div className="space-y-1.5">
        <Label className="font-serif text-sm">Date / time</Label>
        <Input value={value.date} onChange={set("date")} placeholder="Sunday 18 May, 19:00 UTC" />
      </div>
      <div className="space-y-1.5">
        <Label className="font-serif text-sm">Theme</Label>
        <Input value={value.theme} onChange={set("theme")} placeholder="Roots & Renewal" />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label className="font-serif text-sm">RSVP / meeting link</Label>
        <Input value={value.rsvpLink} onChange={set("rsvpLink")} placeholder="https://…" />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label className="font-serif text-sm">Reflection question</Label>
        <Textarea value={value.reflectionQuestion} onChange={set("reflectionQuestion")} className="text-base md:text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="font-serif text-sm">Plant of the week</Label>
        <Input value={value.plantOfWeek ?? ""} onChange={set("plantOfWeek")} />
      </div>
      <div className="space-y-1.5">
        <Label className="font-serif text-sm">Tree of the week</Label>
        <Input value={value.treeOfWeek ?? ""} onChange={set("treeOfWeek")} />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label className="font-serif text-sm">Book of the week</Label>
        <Input value={value.bookOfWeek ?? ""} onChange={set("bookOfWeek")} />
      </div>
    </div>
  );
}
