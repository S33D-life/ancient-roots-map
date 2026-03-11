import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, TreeDeciduous, MapPin, Calendar, Package, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateHarvestListing, CATEGORY_LABELS, AVAILABILITY_LABELS, MONTHS, type CreateHarvestInput, type HarvestCategory, type AvailabilityType, type HarvestStatus } from "@/hooks/use-harvest-listings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateHarvestFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateHarvestForm = ({ onClose, onSuccess }: CreateHarvestFormProps) => {
  const { user } = useAuth();
  const createMutation = useCreateHarvestListing();

  const [produceName, setProduceName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<HarvestCategory>("fruit");
  const [availabilityType, setAvailabilityType] = useState<AvailabilityType>("information");
  const [status, setStatus] = useState<HarvestStatus>("upcoming");
  const [harvestStart, setHarvestStart] = useState<string>("");
  const [harvestEnd, setHarvestEnd] = useState<string>("");
  const [locationName, setLocationName] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [quantityNote, setQuantityNote] = useState("");
  const [priceNote, setPriceNote] = useState("");
  const [pickupInstructions, setPickupInstructions] = useState("");
  const [shippingAvailable, setShippingAvailable] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in first"); return; }
    if (!produceName.trim()) { toast.error("Please enter a produce name"); return; }

    const input: CreateHarvestInput & { guardian_id: string } = {
      guardian_id: user.id,
      produce_name: produceName.trim(),
      description: description.trim() || undefined,
      category,
      availability_type: availabilityType,
      status,
      harvest_month_start: harvestStart ? parseInt(harvestStart) : undefined,
      harvest_month_end: harvestEnd ? parseInt(harvestEnd) : undefined,
      location_name: locationName.trim() || undefined,
      contact_method: contactMethod.trim() || undefined,
      quantity_note: quantityNote.trim() || undefined,
      price_note: priceNote.trim() || undefined,
      pickup_instructions: pickupInstructions.trim() || undefined,
      shipping_available: shippingAvailable,
    };

    try {
      await createMutation.mutateAsync(input);
      toast.success("Harvest listing created");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create listing");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-background/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/30 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-serif font-medium text-foreground flex items-center gap-2">
            <TreeDeciduous className="w-5 h-5 text-primary" />
            Offer a Harvest
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-5">
          {/* Produce Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Produce Name *</Label>
            <Input
              value={produceName}
              onChange={(e) => setProduceName(e.target.value)}
              placeholder="e.g. Heritage Apples, Wild Walnuts"
              className="text-sm"
            />
          </div>

          {/* Category + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as HarvestCategory)}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([key, { label, emoji }]) => (
                    <SelectItem key={key} value={key}>
                      {emoji} {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Availability</Label>
              <Select value={availabilityType} onValueChange={(v) => setAvailabilityType(v as AvailabilityType)}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AVAILABILITY_LABELS).map(([key, { label, emoji }]) => (
                    <SelectItem key={key} value={key}>
                      {emoji} {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell the story of this harvest — the trees, the season, the land…"
              rows={3}
              className="text-sm"
            />
          </div>

          {/* Season */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary/60" />
              Harvest Season
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Select value={harvestStart} onValueChange={setHarvestStart}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Start month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={harvestEnd} onValueChange={setHarvestEnd}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="End month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Current Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as HarvestStatus)}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">🌱 Upcoming</SelectItem>
                <SelectItem value="available">✅ Available Now</SelectItem>
                <SelectItem value="finished">🍂 Finished</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary/60" />
              Location
            </Label>
            <Input
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Somerset, UK"
              className="text-sm"
            />
          </div>

          {/* Quantity + Price */}
          {(availabilityType === "for_sale" || availabilityType === "for_exchange") && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Quantity</Label>
                <Input
                  value={quantityNote}
                  onChange={(e) => setQuantityNote(e.target.value)}
                  placeholder="e.g. 5kg bags"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Price / Exchange</Label>
                <Input
                  value={priceNote}
                  onChange={(e) => setPriceNote(e.target.value)}
                  placeholder="e.g. £5 per bag"
                  className="text-sm"
                />
              </div>
            </div>
          )}

          {/* Pickup + Shipping */}
          {availabilityType !== "information" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Pickup Instructions</Label>
                <Textarea
                  value={pickupInstructions}
                  onChange={(e) => setPickupInstructions(e.target.value)}
                  placeholder="How and where to collect…"
                  rows={2}
                  className="text-sm"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-primary/60" />
                  Shipping available
                </Label>
                <Switch checked={shippingAvailable} onCheckedChange={setShippingAvailable} />
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-primary/60" />
              Contact Method
            </Label>
            <Input
              value={contactMethod}
              onChange={(e) => setContactMethod(e.target.value)}
              placeholder="e.g. Email, phone, message on S33D"
              className="text-sm"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={createMutation.isPending || !produceName.trim()}
            className="w-full"
          >
            {createMutation.isPending ? "Creating…" : "Offer This Harvest"}
          </Button>
        </form>
      </div>
    </motion.div>
  );
};

export default CreateHarvestForm;
