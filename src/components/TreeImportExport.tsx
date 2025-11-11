import { useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { parseCSV, convertCSVToTreeData, generateCSV, downloadCSV } from "@/utils/csvHandler";
import PhotoImport from "./PhotoImport";
import { Upload, Download, Loader2 } from "lucide-react";

const TreeImportExport = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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

      toast({
        title: "Converting coordinates...",
        description: `Processing ${csvRows.length} trees`,
      });

      const treeData = await convertCSVToTreeData(csvRows);

      if (treeData.length === 0) {
        toast({
          title: "Conversion failed",
          description: "Could not convert what3words addresses to coordinates",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      const treesToInsert = treeData.map(tree => ({
        ...tree,
        created_by: user?.id,
      }));

      const { error } = await supabase
        .from('trees')
        .insert(treesToInsert);

      if (error) throw error;

      toast({
        title: "Import successful",
        description: `Successfully imported ${treeData.length} trees`,
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
