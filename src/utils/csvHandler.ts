import { convertToCoordinates } from './what3words';

export interface TreeCSVRow {
  name: string;
  species: string;
  what3words: string;
  lineage?: string;
  description?: string;
  state?: string;
  nation?: string;
  bioregion?: string;
  project_name?: string;
  project_url?: string;
  estimated_age?: number;
  grove_scale?: 'hyper_local' | 'local' | 'regional' | 'national' | 'bioregional' | 'species';
}

export interface TreeData extends TreeCSVRow {
  latitude: number;
  longitude: number;
}

export const parseCSV = (csvText: string): TreeCSVRow[] => {
  // Remove BOM if present
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  const lines = cleanText.split('\n').filter(line => line.trim());
  if (lines.length < 1) return [];

  const firstLine = lines[0].split(',').map(h => h.trim());
  const trees: TreeCSVRow[] = [];

  // Detect if first line has what3words address (indicates no headers)
  const firstLineHasWhat3words = firstLine[1]?.startsWith('///');
  
  // Detect if this is a what3words export format with headers
  const isWhat3WordsExport = !firstLineHasWhat3words && firstLine.some(h => 
    h.toLowerCase() === 'list' || h.toLowerCase() === 'what3words address'
  );

  if (firstLineHasWhat3words) {
    // Headerless format: species, what3words, notes
    console.log('Detected headerless CSV format (species, what3words, notes)');
    
    for (let i = 0; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      const species = values[0];
      const what3wordsAddress = values[1];
      const notes = values[2] || '';
      
      if (!species || !what3wordsAddress || !what3wordsAddress.startsWith('///')) {
        console.log(`Skipping invalid row ${i}: ${lines[i]}`);
        continue;
      }

      // Clean what3words address (remove /// prefix)
      const cleanWhat3words = what3wordsAddress.replace(/^\/\/\//, '');

      const treeRow: TreeCSVRow = {
        name: notes || cleanWhat3words,
        species: species,
        what3words: cleanWhat3words,
        description: notes || '',
      };

      trees.push(treeRow);
    }
  } else {
    // Has headers - parse normally
    const headers = firstLine;
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        const value = values[index];
        if (value) {
          row[header] = value;
        }
      });

      let treeRow: TreeCSVRow;

      if (isWhat3WordsExport) {
        // Handle what3words export format: List (species), what3words address, Label (name/notes)
        const what3wordsAddress = row['what3words address'] || row['What3words address'] || '';
        const species = row['List'] || row['list'] || 'Unknown';
        const label = row['Label'] || row['label'] || '';
        
        if (!what3wordsAddress) continue;

        // Clean what3words address (remove /// prefix if present)
        const cleanWhat3words = what3wordsAddress.replace(/^\/\/\//, '');

        treeRow = {
          name: label || cleanWhat3words,
          species: species,
          what3words: cleanWhat3words,
          description: label || '',
        };
      } else {
        // Handle standard format
        const nameKey = headers.find(h => h.toLowerCase() === 'name') || 'name';
        const speciesKey = headers.find(h => h.toLowerCase() === 'species') || 'species';
        const what3wordsKey = headers.find(h => h.toLowerCase() === 'what3words') || 'what3words';

        if (!row[nameKey] || !row[speciesKey] || !row[what3wordsKey]) continue;

        treeRow = {
          name: row[nameKey],
          species: row[speciesKey],
          what3words: row[what3wordsKey],
          lineage: row.lineage,
          description: row.description,
          state: row.state,
          nation: row.nation,
          bioregion: row.bioregion,
          project_name: row.project_name,
          project_url: row.project_url,
          estimated_age: row.estimated_age ? parseInt(row.estimated_age) : undefined,
          grove_scale: row.grove_scale as any,
        };
      }

      trees.push(treeRow);
    }
  }

  console.log(`Parsed ${trees.length} trees from CSV`);
  return trees;
};

export const convertCSVToTreeData = async (csvRows: TreeCSVRow[]): Promise<TreeData[]> => {
  const treeData: TreeData[] = [];

  for (const row of csvRows) {
    try {
      const coords = await convertToCoordinates(row.what3words);
      if (coords) {
        treeData.push({
          ...row,
          latitude: coords.coordinates.lat,
          longitude: coords.coordinates.lng,
        });
      }
    } catch (error) {
      console.error(`Failed to convert coordinates for ${row.what3words}:`, error);
    }
  }

  return treeData;
};

export const generateCSV = (trees: any[]): string => {
  const headers = [
    'name',
    'species',
    'what3words',
    'latitude',
    'longitude',
    'lineage',
    'description',
    'state',
    'nation',
    'bioregion',
    'project_name',
    'project_url',
    'estimated_age',
    'grove_scale'
  ];

  const rows = trees.map(tree => {
    return headers.map(header => {
      const value = tree[header] || '';
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

export const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
