import { supabase } from "@/integrations/supabase/client";

export interface What3WordsLocation {
  words: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

// Cache and backoff management
const CACHE_KEY_PREFIX = 'w3w_cache_';
const BACKOFF_KEY = 'w3w_backoff_until';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const BACKOFF_DURATION = 60 * 60 * 1000; // 1 hour

function isBackedOff(): boolean {
  const backoffUntil = localStorage.getItem(BACKOFF_KEY);
  if (!backoffUntil) return false;
  
  const until = parseInt(backoffUntil);
  if (Date.now() < until) return true;
  
  localStorage.removeItem(BACKOFF_KEY);
  return false;
}

function setBackoff() {
  const backoffUntil = Date.now() + BACKOFF_DURATION;
  localStorage.setItem(BACKOFF_KEY, backoffUntil.toString());
}

function getCached(key: string): any | null {
  const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
  if (!cached) return null;
  
  try {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
    localStorage.removeItem(CACHE_KEY_PREFIX + key);
  } catch {
    localStorage.removeItem(CACHE_KEY_PREFIX + key);
  }
  return null;
}

function setCache(key: string, data: any) {
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Failed to cache what3words data:', e);
  }
}

export async function convertToCoordinates(words: string): Promise<What3WordsLocation | null> {
  // Check backoff
  if (isBackedOff()) {
    console.warn('What3words API in backoff period');
    throw new Error('quota_exceeded');
  }

  // Check cache
  const cached = getCached(`coords_${words}`);
  if (cached) return cached;

  try {
    // Use edge function for secure API key handling
    const { data, error } = await supabase.functions.invoke('convert-what3words', {
      body: { words },
    });

    if (error) {
      // Check for quota error
      if (error.message?.includes('402') || data?.error === 'quota_exceeded') {
        setBackoff();
        throw new Error('quota_exceeded');
      }
      console.error('What3words conversion error:', error);
      return null;
    }

    // Handle API-level errors returned with 200
    if (data?.error) {
      if (data.error === 'quota_exceeded') {
        setBackoff();
        throw new Error('quota_exceeded');
      }
      console.error('What3words API error payload:', data);
      return null;
    }

    // Cache successful result
    if (data) {
      setCache(`coords_${words}`, data);
    }

    return data;
  } catch (error) {
    if (error instanceof Error && error.message === 'quota_exceeded') {
      throw error;
    }
    console.error('What3words conversion error:', error);
    return null;
  }
}

export async function convertToWhat3Words(lat: number, lng: number): Promise<string | null> {
  // Check backoff
  if (isBackedOff()) {
    console.warn('What3words API in backoff period');
    return null;
  }

  // Check cache
  const cacheKey = `reverse_${lat}_${lng}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.functions.invoke('convert-what3words-reverse', {
      body: { lat, lng },
    });

    if (error) {
      // Check for quota error
      if (error.message?.includes('402') || data?.error === 'quota_exceeded') {
        setBackoff();
      }
      console.error('What3words conversion error:', error);
      return null;
    }

    // Handle API-level errors returned with 200
    if (data?.error) {
      if (data.error === 'quota_exceeded') {
        setBackoff();
      }
      console.error('What3words reverse API error payload:', data);
      return null;
    }

    // Cache successful result
    if (data?.words) {
      setCache(cacheKey, data.words);
    }

    return data?.words || null;
  } catch (error) {
    console.error('What3words conversion error:', error);
    return null;
  }
}

export async function autosuggest(input: string): Promise<string[]> {
  // Skip autosuggest during backoff to conserve quota
  if (isBackedOff()) {
    return [];
  }

  // Check cache
  const cached = getCached(`suggest_${input}`);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.functions.invoke('convert-what3words-autosuggest', {
      body: { input },
    });

    if (error) {
      // Check for quota error
      if (error.message?.includes('402') || data?.error === 'quota_exceeded') {
        setBackoff();
      }
      console.error('What3words autosuggest error:', error);
      return [];
    }

    // Handle API-level errors returned with 200
    if (data?.error) {
      if (data.error === 'quota_exceeded') {
        setBackoff();
      }
      console.error('What3words autosuggest API error payload:', data);
      return [];
    }

    // Cache successful result
    if (data?.suggestions) {
      setCache(`suggest_${input}`, data.suggestions);
    }

    return data?.suggestions || [];
  } catch (error) {
    console.error('What3words autosuggest error:', error);
    return [];
  }
}
