import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { TreePine, Map, Home, BookOpen, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useDocumentTitle } from "@/hooks/use-document-title";

const NotFound = () => {
  useDocumentTitle("Page Not Found");
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-28 md:pb-20 text-center" style={{ paddingTop: 'var(--content-top)' }}>
        {/* Atmospheric glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 40%, hsl(var(--primary) / 0.06), transparent 60%)",
          }}
        />
        <TreePine className="h-16 w-16 text-primary/30 mb-6" />
        <h1 className="text-5xl font-serif text-primary mb-3">404</h1>
        <p className="text-lg text-muted-foreground font-serif mb-2">
          This path leads deeper into the unknown forest…
        </p>
        <p className="text-sm text-muted-foreground/70 font-serif mb-8">
          The route <code className="bg-secondary/50 px-2 py-0.5 rounded text-xs">{location.pathname}</code> doesn't exist.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild variant="default" className="font-serif text-xs tracking-wider gap-2">
            <Link to="/"><Home className="h-3.5 w-3.5" /> Return Home</Link>
          </Button>
          <Button asChild variant="outline" className="font-serif text-xs tracking-wider gap-2">
            <Link to="/map"><Map className="h-3.5 w-3.5" /> Explore Map</Link>
          </Button>
          <Button asChild variant="outline" className="font-serif text-xs tracking-wider gap-2">
            <Link to="/hives"><TreePine className="h-3.5 w-3.5" /> Species Hives</Link>
          </Button>
          <Button asChild variant="outline" className="font-serif text-xs tracking-wider gap-2">
            <Link to="/library"><BookOpen className="h-3.5 w-3.5" /> Visit Library</Link>
          </Button>
          <Button asChild variant="outline" className="font-serif text-xs tracking-wider gap-2">
            <Link to="/council-of-life"><Leaf className="h-3.5 w-3.5" /> Council</Link>
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
