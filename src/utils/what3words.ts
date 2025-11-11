import { supabase } from "@/integrations/supabase/client";

export interface What3WordsLocation {
  words: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export async function convertToCoordinates(words: string): Promise<What3WordsLocation | null> {
  try {
    // Use edge function for secure API key handling
    const { data, error } = await supabase.functions.invoke('convert-what3words', {
      body: { words },
    });

    if (error) {
      console.error('What3words conversion error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('What3words conversion error:', error);
    return null;
  }
}

export async function convertToWhat3Words(lat: number, lng: number): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('convert-what3words-reverse', {
      body: { lat, lng },
    });

    if (error) {
      console.error('What3words conversion error:', error);
      return null;
    }

    return data?.words || null;
  } catch (error) {
    console.error('What3words conversion error:', error);
    return null;
  }
}

export async function autosuggest(input: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.functions.invoke('convert-what3words-autosuggest', {
      body: { input },
    });

    if (error) {
      console.error('What3words autosuggest error:', error);
      return [];
    }

    return data?.suggestions || [];
  } catch (error) {
    console.error('What3words autosuggest error:', error);
    return [];
  }
}
