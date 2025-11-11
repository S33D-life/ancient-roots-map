const WHAT3WORDS_API_KEY = 'B7M0D3S0';
const API_BASE = 'https://api.what3words.com/v3';

export interface What3WordsLocation {
  words: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export async function convertToCoordinates(words: string): Promise<What3WordsLocation | null> {
  try {
    const response = await fetch(
      `${API_BASE}/convert-to-coordinates?words=${encodeURIComponent(words)}&key=${WHAT3WORDS_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to convert what3words address');
    }
    
    const data = await response.json();
    
    return {
      words: data.words,
      coordinates: {
        lat: data.coordinates.lat,
        lng: data.coordinates.lng,
      },
    };
  } catch (error) {
    console.error('What3words conversion error:', error);
    return null;
  }
}

export async function convertToWhat3Words(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `${API_BASE}/convert-to-3wa?coordinates=${lat}%2C${lng}&key=${WHAT3WORDS_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to convert coordinates to what3words');
    }
    
    const data = await response.json();
    return data.words;
  } catch (error) {
    console.error('What3words conversion error:', error);
    return null;
  }
}

export async function autosuggest(input: string): Promise<string[]> {
  try {
    const response = await fetch(
      `${API_BASE}/autosuggest?input=${encodeURIComponent(input)}&key=${WHAT3WORDS_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to get suggestions');
    }
    
    const data = await response.json();
    return data.suggestions?.map((s: any) => s.words) || [];
  } catch (error) {
    console.error('What3words autosuggest error:', error);
    return [];
  }
}
