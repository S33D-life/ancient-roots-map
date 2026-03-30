/**
 * SeedLibraryDetail — Detail view of a single seed library with verify + testimonial.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, MapPin, ExternalLink, Users, MessageCircle, CheckCircle2, Shield,
} from "lucide-react";
import {
  useSeedLibrary,
  useSeedLibraryVerifications,
  useSeedLibraryTestimonials,
  useAddVerification,
  useAddTestimonial,
} from "@/hooks/use-seed-libraries";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";

const VERIFICATION_COLORS: Record<string, string> = {
  unverified: "bg-muted text-muted-foreground",
  community_verified: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  curator_verified: "bg-primary/15 text-primary",
};

const VERIFICATION_LABELS: Record<string, string> = {
  unverified: "Unverified",
  community_verified: "Community Verified",
  curator_verified: "Curator Verified",
};

const TYPE_LABELS: Record<string, string> = {
  seed_library: "Seed Library",
  seed_bank: "Seed Bank",
  seed_swap: "Seed Swap",
  community_seed_initiative: "Community Initiative",
};

const VERIFY_TYPES = [
  { value: "visited", label: "I've visited this seed library" },
  { value: "used", label: "I've used this seed library" },
  { value: "run", label: "I help run this seed library" },
];

interface Props {
  slug: string;
  onBack: () => void;
}

export default function SeedLibraryDetail({ slug, onBack }: Props) {
  const { data: library, isLoading } = useSeedLibrary(slug);
  const { data: verifications = [] } = useSeedLibraryVerifications(library?.id);
  const { data: testimonials = [] } = useSeedLibraryTestimonials(library?.id);
  const { userId } = useCurrentUser();

  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);

  const addVerification = useAddVerification();
  const addTestimonial = useAddTestimonial();

  const [verifyType, setVerifyType] = useState("visited");
  const [verifyNote, setVerifyNote] = useState("");
  const [testimonialContent, setTestimonialContent] = useState("");
  const [testimonialName, setTestimonialName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const hasUserVerified = verifications.some((v) => v.user_id === userId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="h-64 rounded-xl bg-muted/30 animate-pulse" />
      </div>
    );
  }

  if (!library) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Library not found</p>
        <Button variant="ghost" size="sm" onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>
    );
  }

  const handleVerify = () => {
    if (!library) return;
    addVerification.mutate(
      { library_id: library.id, verification_type: verifyType, note: verifyNote || undefined },
      { onSuccess: () => { setShowVerifyForm(false); setVerifyNote(""); } },
    );
  };

  const handleTestimonial = () => {
    if (!library || !testimonialContent.trim()) return;
    addTestimonial.mutate(
      {
        library_id: library.id,
        content: testimonialContent.trim(),
        display_name: testimonialName || undefined,
        is_anonymous: isAnonymous,
      },
      { onSuccess: () => { setShowTestimonialForm(false); setTestimonialContent(""); setTestimonialName(""); } },
    );
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to directory
      </Button>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl md:text-2xl font-serif text-foreground">{library.name}</h2>
          <Badge className={VERIFICATION_COLORS[library.verification_status] || ""}>
            {library.verification_status === "curator_verified" && <Shield className="w-3 h-3 mr-1" />}
            {VERIFICATION_LABELS[library.verification_status]}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {[library.city, library.region, library.country].filter(Boolean).join(", ")}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted">
            {TYPE_LABELS[library.library_type] || library.library_type}
          </span>
        </div>

        {library.address && (
          <p className="text-xs text-muted-foreground/80">{library.address}</p>
        )}

        {library.description && (
          <p className="text-sm text-foreground/70 leading-relaxed">{library.description}</p>
        )}

        <div className="flex gap-3">
          {library.website && (
            <a
              href={library.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" /> Website
            </a>
          )}
          {library.contact_link && (
            <a
              href={library.contact_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" /> Contact
            </a>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {library.verification_count} verifications
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" /> {library.testimonial_count} stories
          </span>
          {library.last_community_activity && (
            <span>
              Last activity {formatDistanceToNow(new Date(library.last_community_activity), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {userId && (
        <div className="flex gap-2">
          {!hasUserVerified && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVerifyForm((v) => !v)}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" /> Verify
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTestimonialForm((v) => !v)}
          >
            <MessageCircle className="w-4 h-4 mr-1" /> Share a Story
          </Button>
        </div>
      )}

      {/* Verify form */}
      {showVerifyForm && (
        <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3 animate-fade-in">
          <h4 className="text-sm font-medium">How do you know this seed library?</h4>
          <Select value={verifyType} onValueChange={setVerifyType}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VERIFY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Optional note…"
            value={verifyNote}
            onChange={(e) => setVerifyNote(e.target.value)}
            className="text-sm min-h-[60px]"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleVerify} disabled={addVerification.isPending}>
              {addVerification.isPending ? "Submitting…" : "Confirm"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowVerifyForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Testimonial form */}
      {showTestimonialForm && (
        <div className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3 animate-fade-in">
          <h4 className="text-sm font-medium">Share your story about this place</h4>
          <Textarea
            placeholder="What was your experience like?"
            value={testimonialContent}
            onChange={(e) => setTestimonialContent(e.target.value)}
            className="text-sm min-h-[80px]"
          />
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Display name (optional)"
              value={testimonialName}
              onChange={(e) => setTestimonialName(e.target.value)}
              className="text-sm h-9 w-48"
              disabled={isAnonymous}
            />
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded"
              />
              Anonymous
            </label>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleTestimonial}
              disabled={addTestimonial.isPending || !testimonialContent.trim()}
            >
              {addTestimonial.isPending ? "Sharing…" : "Share"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowTestimonialForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Verifications */}
      {verifications.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground/80 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Verifications ({verifications.length})
          </h4>
          <div className="space-y-1.5">
            {verifications.map((v) => (
              <div key={v.id} className="text-xs text-muted-foreground flex items-center gap-2 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <span>{VERIFY_TYPES.find((t) => t.value === v.verification_type)?.label || v.verification_type}</span>
                {v.note && <span className="text-foreground/50">— {v.note}</span>}
                <span className="ml-auto text-[10px]">
                  {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground/80 flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-primary/70" />
            Stories ({testimonials.length})
          </h4>
          <div className="space-y-3">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="rounded-lg border border-border/40 bg-card/30 p-3 space-y-1.5"
              >
                <p className="text-sm text-foreground/80 leading-relaxed italic">
                  "{t.content}"
                </p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{t.is_anonymous ? "Anonymous wanderer" : (t.display_name || "A seed keeper")}</span>
                  <span>{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!userId && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Sign in to verify this library or share your story
        </p>
      )}
    </div>
  );
}
