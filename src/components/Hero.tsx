import { Button } from "@/components/ui/button";
import { MapPin, TreeDeciduous, Sparkles } from "lucide-react";
import heroTree from "@/assets/hero-tree.jpg";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroTree})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>

      {/* Sacred Geometry Overlay */}
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-32 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-block">
            <Sparkles className="w-12 h-12 text-mystical-glow animate-pulse-glow mx-auto mb-6" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-wider text-mystical leading-tight">
            ANCIENT FRIENDS
          </h1>
          
          <p className="text-xl md:text-2xl text-foreground/90 font-light leading-relaxed max-w-2xl mx-auto">
            A Living Map of Ancient Trees
          </p>
          
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Map and honor ancient trees worldwide. Connect with sacred groves through what3words locations, 
            share offerings, and explore a planetary web of wisdom keepers spanning millennia.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Button 
              variant="mystical" 
              size="lg" 
              className="min-w-[200px]"
              asChild
            >
              <Link to="/map">
                <MapPin className="w-5 h-5 mr-2" />
                Explore the Map
              </Link>
            </Button>
            
            <Button 
              variant="sacred" 
              size="lg" 
              className="min-w-[200px]"
            >
              <TreeDeciduous className="w-5 h-5 mr-2" />
              Add a Tree
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-16 max-w-2xl mx-auto">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-serif font-bold text-mystical">
                1,247
              </div>
              <div className="text-sm text-muted-foreground">Ancient Trees</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-serif font-bold text-mystical">
                87
              </div>
              <div className="text-sm text-muted-foreground">Species Mapped</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-serif font-bold text-mystical">
                43
              </div>
              <div className="text-sm text-muted-foreground">Nations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
