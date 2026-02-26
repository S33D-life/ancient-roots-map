import { Heart, TreeDeciduous, RotateCcw, Search, Smartphone, Bug } from "lucide-react";
import { Link } from "react-router-dom";
import JourneyPulse from "@/components/JourneyPulse";
import { resetWhispers } from "@/components/ContextualWhisper";

const Footer = () => {
  const Dot = () => <span className="text-border/60 select-none" aria-hidden>·</span>;

  return (
    <footer className="border-t border-border/40 bg-card/30 backdrop-blur-sm mt-16">
      <div className="max-w-7xl mx-auto px-4 py-6 pb-20 md:pb-6 space-y-3">
        {/* Journey Pulse — only shows when logged in */}
        <div className="flex justify-center">
          <JourneyPulse />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <TreeDeciduous className="w-3.5 h-3.5 text-primary" />
            <span className="font-serif">s33d.life</span>
          </div>
          <Dot />
          <a
            href="https://giveth.io/project/s33dlife"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <Heart className="w-3.5 h-3.5" />
            Support us on Giveth
          </a>
          <Dot />
          <Link to="/assets" className="hover:text-primary transition-colors">
            Assets
          </Link>
          <Dot />
          <button
            onClick={() => {
              localStorage.removeItem("ancient-friends-tour-seen");
              resetWhispers();
              window.location.href = "/";
            }}
            className="inline-flex items-center gap-1 hover:text-primary transition-colors py-1"
          >
            <RotateCcw className="w-3 h-3" />
            Restart Whispers
          </button>
          <Dot />
          <button
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
            }}
            className="inline-flex items-center gap-1.5 hover:text-primary transition-colors py-1"
            title="Search (⌘K)"
          >
            <Search className="w-3 h-3" />
            <span className="font-mono text-[10px] opacity-60">⌘K</span>
          </button>
          <Dot />
          <Link to="/install" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
            <Smartphone className="w-3 h-3" />
            Plant this app
          </Link>
          <Dot />
          <Link to="/bug-garden" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
            <Bug className="w-3 h-3" />
            Bug Garden
          </Link>
          <Dot />
          <span className="text-xs text-muted-foreground/60">EST 2016 · hello@s33d.life</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
