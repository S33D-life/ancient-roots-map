import { useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { convertToCoordinates } from "@/utils/what3words";
import { Camera, Loader2 } from "lucide-react";

const PhotoImport = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const base64Image = reader.result as string;

        toast({
          title: "Analyzing image...",
          description: "Extracting what3words address from photo",
        });

        // Call edge function to extract what3words
        const { data, error } = await supabase.functions.invoke('extract-what3words-from-image', {
          body: { imageData: base64Image }
        });

        if (error) throw error;

        if (!data.success) {
          toast({
            title: "Extraction failed",
            description: data.error || "Could not find what3words address in image",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }

        const what3words = data.what3words;
        
        toast({
          title: "Found address!",
          description: `Detected: ${what3words}`,
        });

        // Convert to coordinates
        const coords = await convertToCoordinates(what3words);
        
        if (!coords) {
          toast({
            title: "Invalid address",
            description: "Could not convert what3words to coordinates",
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }

        // Pre-fill form data (you can expand this to include the actual form)
        toast({
          title: "Success!",
          description: `Ready to add tree at ${what3words}`,
        });

        // Store the data for the add tree form
        localStorage.setItem('pendingTreeData', JSON.stringify({
          what3words,
          latitude: coords.coordinates.lat,
          longitude: coords.coordinates.lng,
          photoData: base64Image
        }));

        setIsProcessing(false);
        
        // You can trigger opening an add tree form here
        toast({
          title: "Tree data ready",
          description: "Click 'Add Tree' to complete the form",
        });
      };

      reader.onerror = () => {
        toast({
          title: "Error reading file",
          description: "Could not read the image file",
          variant: "destructive",
        });
        setIsProcessing(false);
      };

    } catch (error) {
      console.error('Photo import error:', error);
      toast({
        title: "Import failed",
        description: "An error occurred while processing the photo",
        variant: "destructive",
      });
      setIsProcessing(false);
    }

    // Reset input
    event.target.value = '';
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
        id="photo-upload"
        disabled={isProcessing}
      />
      <label htmlFor="photo-upload">
        <Button
          variant="secondary"
          size="sm"
          disabled={isProcessing}
          className="cursor-pointer"
          asChild
        >
          <span>
            {isProcessing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Camera className="h-4 w-4 mr-2" />
            )}
            Import Photo
          </span>
        </Button>
      </label>
    </div>
  );
};

export default PhotoImport;
