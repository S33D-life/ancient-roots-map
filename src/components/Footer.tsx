import { TreeDeciduous, Heart, Map } from "lucide-react";
import { Link } from "react-router-dom";
import JourneyPulse from "@/components/JourneyPulse";

const Footer = () => {
  const Dot = () => <span className="text-border/40 select-none" aria-hidden>·</span>;

  return (
    <footer className="border-t border-border/15 bg-card/40 backdrop-blur-sm mt-12">
      <div className="max-w-7xl mx-auto px-4 py-5 pb-24 md:pb-5 space-y-3">
        {/* Journey Pulse — only shows when logged in */}
        <div className="flex justify-center">
          <JourneyPulse />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted-foreground/70">
          <Link to="/roadmap" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
            <Map className="w-3 h-3" />
            Roadmap
          </Link>
          <Dot />
          <Link to="/support" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
            <Heart className="w-3 h-3" />
            Support
          </Link>
          <Dot />
          <Link to="/bug-garden" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
            <Sparkles className="w-3 h-3" />
            Feedback
          </Link>
          <Dot />
          <Link to="/about" className="hover:text-primary transition-colors">About</Link>
        </div>

        <div className="flex items-center justify-center gap-x-2 text-[10px] text-muted-foreground/40">
          <a
            href="https://t.me/s33dlife"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-primary/60 transition-colors"
          >
            <TreeDeciduous className="w-2.5 h-2.5" />
            <span className="font-serif">s33d.life</span>
          </a>
          <Dot />
          <span>EST 2016</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
