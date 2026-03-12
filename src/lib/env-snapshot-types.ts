/**
 * Environmental sensing types for Tree Health Snapshots.
 *
 * Captured optionally during co-witness sessions using standard
 * phone sensors — ambient light, microphone, camera, GPS.
 */

/** Ambient light reading from device light sensor or camera exposure */
export interface CanopyLightReading {
  /** Estimated lux value (0 = dark canopy, 100k+ = open sky) */
  lux: number;
  /** Rough canopy coverage percentage derived from lux */
  canopyCoveragePct: number;
  /** Whether reading came from AmbientLightSensor or camera fallback */
  source: "sensor" | "camera_estimate";
  capturedAt: string;
}

/** Ambient sound metadata — we store analysis, not raw audio */
export interface AmbientSoundReading {
  /** Duration recorded in seconds */
  durationSec: number;
  /** Average dB level */
  avgDbLevel: number;
  /** Peak dB level */
  peakDbLevel: number;
  /** Simple frequency band dominance */
  dominantBand: "low" | "mid" | "high";
  /** Whether birdsong-range frequencies were detected */
  birdsongDetected: boolean;
  /** Whether wind/water sounds were present */
  naturalSoundsPresent: boolean;
  capturedAt: string;
}

/** GPS confidence from dual-device triangulation */
export interface DualGPSReading {
  /** Average lat from both devices */
  avgLat: number;
  /** Average lng from both devices */
  avgLng: number;
  /** Distance between the two devices in meters */
  deviceSeparationM: number;
  /** Combined accuracy (average of both accuracies) */
  combinedAccuracyM: number;
  /** Confidence tier */
  confidence: "high" | "medium" | "low";
}

/** Multi-angle photo capture metadata */
export interface PhotoCaptureMeta {
  /** Number of photos captured by initiator */
  initiatorCount: number;
  /** Number of photos captured by joiner */
  joinerCount: number;
  /** Whether canopy-up photo was included */
  hasCanopyShot: boolean;
  /** Whether trunk/bark detail was included */
  hasTrunkShot: boolean;
}

/** The full Tree Health Snapshot */
export interface TreeHealthSnapshot {
  /** Schema version for future-proofing */
  version: 1;
  /** When the snapshot was assembled */
  capturedAt: string;
  /** Optional canopy light data */
  light?: CanopyLightReading;
  /** Optional ambient sound data */
  sound?: AmbientSoundReading;
  /** Dual-GPS triangulation */
  gps?: DualGPSReading;
  /** Photo capture metadata */
  photos?: PhotoCaptureMeta;
  /** Season hint from device date */
  seasonHint: string;
  /** Device info for context */
  devices: {
    initiator: string;
    joiner?: string;
  };
}

/** Quality tiers based on which signals were captured */
export type SnapshotQuality = "basic" | "standard" | "rich";

/** Derive quality from a snapshot */
export function computeSnapshotQuality(snap: TreeHealthSnapshot): SnapshotQuality {
  let signals = 0;
  if (snap.gps) signals++;
  if (snap.light) signals++;
  if (snap.sound) signals++;
  if (snap.photos && (snap.photos.initiatorCount + snap.photos.joinerCount) >= 2) signals++;
  if (signals >= 3) return "rich";
  if (signals >= 2) return "standard";
  return "basic";
}

/** Get the current season hint from date and hemisphere estimate */
export function getSeasonHint(lat?: number): string {
  const month = new Date().getMonth(); // 0-11
  const southern = lat != null && lat < 0;
  const seasons = southern
    ? ["summer", "summer", "autumn", "autumn", "autumn", "winter", "winter", "winter", "spring", "spring", "spring", "summer"]
    : ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"];
  return seasons[month];
}

/** Simple device identifier for context */
export function getDeviceLabel(): string {
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android";
  return "Desktop";
}
