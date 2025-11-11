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
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const trees: TreeCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: any = {};

    headers.forEach((header, index) => {
      const value = values[index];
      if (value) {
        if (header === 'estimated_age') {
          row[header] = parseInt(value);
        } else {
          row[header] = value;
        }
      }
    });

    if (row.name && row.species && row.what3words) {
      trees.push(row);
    }
  }

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
