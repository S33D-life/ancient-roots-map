import { supabase } from "@/integrations/supabase/client";
import { parseCSV } from "./csvHandler";

export async function preloadCollectiveTrees() {
  try {
    // Fetch the CSV file
    const response = await fetch('/src/data/collective-trees.csv');
    const text = await response.text();
    
    // Parse the CSV
    const csvRows = parseCSV(text);
    
    if (csvRows.length === 0) {
      console.error('No trees found in CSV');
      return { success: false, error: 'No trees found' };
    }

    

    // Get current user (or use system user if no user logged in)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Insert trees without coordinates - they'll be converted later
    const treesToInsert = csvRows.map(tree => ({
      ...tree,
      created_by: user?.id || null,
      latitude: null,
      longitude: null,
    }));

    // Insert in batches to avoid hitting size limits
    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < treesToInsert.length; i += batchSize) {
      const batch = treesToInsert.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('trees')
        .insert(batch);

      if (error) {
        console.error(`Batch ${i / batchSize + 1} failed:`, error);
        return { 
          success: false, 
          error: error.message,
          inserted: totalInserted 
        };
      }
      
      totalInserted += batch.length;
      console.log(`Inserted batch ${i / batchSize + 1}: ${totalInserted}/${treesToInsert.length} trees`);
    }

    console.log(`Successfully preloaded ${totalInserted} collective trees`);
    return { success: true, inserted: totalInserted };
  } catch (error) {
    console.error('Preload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
