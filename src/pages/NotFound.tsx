import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { TreePine, Map, Home, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <TreePine className="h-16 w-16 text-primary/40 mb-6" />
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
            <Link to="/library"><BookOpen className="h-3.5 w-3.5" /> Visit Library</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
