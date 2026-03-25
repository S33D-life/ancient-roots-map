/**
 * EcosystemContextBanner — A subtle, persistent cue showing where
 * the user is within the S33D ecosystem. Provides orientation
 * ("You are in: Heartwood Library") and a one-line purpose label.
 */
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface Props {
  zone: string;
  subtitle: string;
  parentLink?: { label: string; to: string };
}

const EcosystemContextBanner = ({ zone, subtitle, parentLink }: Props) => (
  <div className="flex items-center gap-2 text-[11px] font-serif text-muted-foreground/70 mb-4 select-none">
    {parentLink && (
      <>
        <Link
          to={parentLink.to}
          className="hover:text-primary transition-colors"
        >
          {parentLink.label}
        </Link>
        <ChevronRight className="w-2.5 h-2.5 text-border/60" />
      </>
    )}
    <span className="text-foreground/50">You are in:</span>
    <span className="text-foreground/70 font-medium">{zone}</span>
    <span className="text-border/50">·</span>
    <span className="text-muted-foreground/60 italic">{subtitle}</span>
  </div>
);

export default EcosystemContextBanner;
