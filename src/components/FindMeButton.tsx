import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Locate, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddTreeDialog from "./AddTreeDialog";

interface FindMeButtonProps {
  onLocationFound?: (lat: number, lng: number) => void;
}

const FindMeButton = ({ onLocationFound }: FindMeButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  const handleFindMe = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        onLocationFound?.(latitude, longitude);
        setLoading(false);
        setDialogOpen(true);
      },
      (error) => {
        setLoading(false);
        let message = "Unable to get your location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Please allow location access to add a tree";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            message = "Location request timed out";
            break;
        }
        
        toast({
          title: "Location Error",
          description: message,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <>
      <Button
        onClick={handleFindMe}
        disabled={loading}
        variant="mystical"
        className="shadow-lg"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Locate className="h-4 w-4 mr-2" />
        )}
        Find Me & Add Tree
      </Button>

      <AddTreeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        latitude={location?.lat || null}
        longitude={location?.lng || null}
      />
    </>
  );
};

export default FindMeButton;
