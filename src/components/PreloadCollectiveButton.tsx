import { useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { preloadCollectiveTrees } from "@/utils/preloadCollectiveTrees";
import { Database, Loader2 } from "lucide-react";

const PreloadCollectiveButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePreload = async () => {
    setIsLoading(true);

    try {
      const result = await preloadCollectiveTrees();

      if (result.success) {
        toast({
          title: "Collective trees loaded",
          description: `Successfully preloaded ${result.inserted} trees. Use "Convert Coordinates" to add locations.`,
        });
      } else {
        toast({
          title: "Preload failed",
          description: result.error || "An error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Preload error:', error);
      toast({
        title: "Preload failed",
        description: "An error occurred while preloading trees",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePreload}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Database className="h-4 w-4 mr-2" />
      )}
      Preload Collective (849)
    </Button>
  );
};

export default PreloadCollectiveButton;
