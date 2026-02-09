import { Heart, TreeDeciduous } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-card/30 backdrop-blur-sm mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TreeDeciduous className="w-4 h-4 text-primary" />
            <span className="font-serif">s33d.life</span>
            <span>·</span>
            <span>Ancient Friends Map</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://giveth.io/project/s33dlife"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Heart className="w-4 h-4" />
              <span>Support us on Giveth</span>
            </a>
          </div>

          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} s33d.life · All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
