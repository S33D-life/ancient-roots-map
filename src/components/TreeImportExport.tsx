import { useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { parseCSV, generateCSV, downloadCSV } from "@/utils/csvHandler";
import { convertToCoordinates } from "@/utils/what3words";
import PhotoImport from "./PhotoImport";
import PreloadCollectiveButton from "./PreloadCollectiveButton";
import { Upload, Download, Loader2, MapPin } from "lucide-react";

const TreeImportExport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [batchSize, setBatchSize] = useState(50);
  const { toast } = useToast();

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const text = await file.text();
      const csvRows = parseCSV(text);

      if (csvRows.length === 0) {
        toast({
          title: "Invalid CSV",
          description: "No valid tree data found in the CSV file",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to import trees",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      // Enrich species and insert trees without coordinates - they'll be converted later
      const enrichedCount = csvRows.filter(t => t.lineage).length;
      const treesToInsert = csvRows.map(tree => ({
        ...tree,
        created_by: user.id,
        latitude: null,
        longitude: null,
      }));

      const { error } = await supabase
        .from('trees')
        .insert(treesToInsert);

      if (error) throw error;

      toast({
        title: "Import successful",
        description: `Imported ${csvRows.length} trees${enrichedCount > 0 ? ` (${enrichedCount} enriched with scientific names)` : ''}. Use "Convert Coordinates" to add locations.`,
      });

      // Reset the input
      event.target.value = '';
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: "An error occurred while importing the CSV",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleConvertCoordinates = async () => {
    setIsConverting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to convert coordinates",
          variant: "destructive",
        });
        setIsConverting(false);
        return;
      }

      // Fetch trees without coordinates (limited by batch size)
      const { data: trees, error: fetchError } = await supabase
        .from('trees')
        .select('*')
        .is('latitude', null)
        .is('longitude', null)
        .eq('created_by', user.id)
        .limit(batchSize);

      if (fetchError) throw fetchError;

      if (!trees || trees.length === 0) {
        toast({
          title: "No trees to convert",
          description: "All your trees already have coordinates",
        });
        setIsConverting(false);
        return;
      }

      let converted = 0;
      let failed = 0;

      toast({
        title: "Converting coordinates...",
        description: `Processing batch of ${trees.length} trees`,
      });

      for (const tree of trees) {
        try {
          const coords = await convertToCoordinates(tree.what3words);
          
          if (coords) {
            const { error: updateError } = await supabase
              .from('trees')
              .update({
                latitude: coords.coordinates.lat,
                longitude: coords.coordinates.lng,
              })
              .eq('id', tree.id);

            if (!updateError) {
              converted++;
            } else {
              failed++;
            }
          } else {
            failed++;
          }
        } catch (error) {
          if (error instanceof Error && error.message === 'quota_exceeded') {
            toast({
              title: "API quota exceeded",
              description: `Converted ${converted} of ${trees.length} trees before hitting quota. Try again later.`,
              variant: "destructive",
            });
            setIsConverting(false);
            return;
          }
          failed++;
        }
      }

      toast({
        title: "Conversion complete",
        description: `Converted ${converted} trees${failed > 0 ? `, ${failed} failed` : ''}`,
      });
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: "Conversion failed",
        description: "An error occurred while converting coordinates",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const { data: trees, error } = await supabase
        .from('trees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!trees || trees.length === 0) {
        toast({
          title: "No data to export",
          description: "There are no trees in the database",
          variant: "destructive",
        });
        setIsExporting(false);
        return;
      }

      const csv = generateCSV(trees);
      const filename = `ancient-friends-trees-${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csv, filename);

      toast({
        title: "Export successful",
        description: `Exported ${trees.length} trees to ${filename}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting the CSV",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="absolute top-20 left-4 z-10 flex gap-2">
      <PhotoImport />
      
      <PreloadCollectiveButton />
      
      <div className="relative">
        <input
          type="file"
          accept=".csv"
          onChange={handleImport}
          className="hidden"
          id="csv-upload"
          disabled={isImporting}
        />
        <label htmlFor="csv-upload">
          <Button
            variant="secondary"
            size="sm"
            disabled={isImporting}
            className="cursor-pointer"
            asChild
          >
            <span>
              {isImporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Import CSV
            </span>
          </Button>
        </label>
      </div>

      <div className="flex gap-1">
        <select
          value={batchSize}
          onChange={(e) => setBatchSize(Number(e.target.value))}
          disabled={isConverting}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value={10}>10</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleConvertCoordinates}
          disabled={isConverting}
        >
          {isConverting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4 mr-2" />
          )}
          Convert Coordinates
        </Button>
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        Export CSV
      </Button>
    </div>
  );
};

export default TreeImportExport;
