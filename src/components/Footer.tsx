import { Heart, TreeDeciduous, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const Dot = () => <span className="text-border/60 select-none" aria-hidden>·</span>;

  return (
    <footer className="border-t border-border/40 bg-card/30 backdrop-blur-sm mt-16">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
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
              window.location.href = "/";
            }}
            className="inline-flex items-center gap-1 hover:text-primary transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Restart Tour
          </button>
          <Dot />
          <span className="text-xs text-muted-foreground/60">EST 2016 · hello@s33d.life</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
