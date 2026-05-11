import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calcHeartsDiscount, formatGBP } from "@/lib/life-groves/types";

interface Props {
  packagePence: number;
  heartsApplied: number;
  onChange: (v: number) => void;
}

export default function HeartsDiscountPanel({ packagePence, heartsApplied, onChange }: Props) {
  const { discountPence, totalPence, capPence } = calcHeartsDiscount(packagePence, heartsApplied);
  return (
    <div className="rounded-xl border border-border/40 bg-card/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="hearts" className="font-serif text-sm">Apply Hearts</Label>
        <span className="text-[11px] font-serif text-muted-foreground/70">
          1 Heart = £0.01, up to 33%
        </span>
      </div>
      <Input
        id="hearts"
        type="number"
        min={0}
        max={Math.max(0, capPence)}
        value={heartsApplied}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value || "0", 10)))}
        inputMode="numeric"
      />
      <div className="grid grid-cols-3 gap-2 text-xs font-serif">
        <div>
          <p className="text-muted-foreground/70">Package</p>
          <p className="text-foreground">{formatGBP(packagePence)}</p>
        </div>
        <div>
          <p className="text-muted-foreground/70">Hearts</p>
          <p className="text-foreground">−{formatGBP(discountPence)}</p>
        </div>
        <div>
          <p className="text-muted-foreground/70">Total</p>
          <p className="text-primary">{formatGBP(totalPence)}</p>
        </div>
      </div>
      <p className="text-[11px] font-serif text-muted-foreground/60 italic">
        Payments and planting partnerships will connect later.
      </p>
    </div>
  );
}
