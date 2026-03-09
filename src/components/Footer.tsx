import { TreeDeciduous, Smartphone, Sparkles, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import JourneyPulse from "@/components/JourneyPulse";

const Footer = () => {
  const Dot = () => <span className="text-border/40 select-none" aria-hidden>·</span>;

  return (
    <footer className="border-t border-border/15 bg-card/15 backdrop-blur-sm mt-12">
      <div className="max-w-7xl mx-auto px-4 py-5 pb-5 space-y-3">
        {/* Journey Pulse — only shows when logged in */}
        <div className="flex justify-center">
          <JourneyPulse />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted-foreground/70">
          <div className="flex items-center gap-1.5">
            <TreeDeciduous className="w-3 h-3 text-primary/60" />
            <span className="font-serif">s33d.life</span>
          </div>
          <Dot />
          <Link to="/support" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
            <Heart className="w-3 h-3" />
            Support
          </Link>
          <Dot />
          <Link to="/install" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
            <Smartphone className="w-3 h-3" />
            Install
          </Link>
          <Dot />
          <Link to="/bug-garden" className="inline-flex items-center gap-1 hover:text-primary transition-colors">
            <Sparkles className="w-3 h-3" />
            Council Sparks
          </Link>
          <Dot />
          <span className="text-[10px] text-muted-foreground/40">EST 2016</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
