/**
 * Warm, human-language strings.
 *
 * Replaces "failed/error/invalid" wording with grounded, encounter-style
 * phrasing. Keep additions short and field-friendly.
 */

export const copy = {
  // Generic outcomes
  couldNotTakeRoot: "This action could not take root yet",
  tryAgainSoftly: "Take a breath and try once more",

  // GPS / presence
  seekingRoots: "Seeking your roots…",
  locating: "Locating your position…",
  signalUncertain: "Signal uncertain beneath the canopy",
  nearbyLowConfidence: "You appear nearby, but GPS confidence is low",
  stepIntoClearSky: "Try stepping into a clearer patch of sky",
  gpsDenied: "Location is currently hidden — enable it to encounter this tree",

  // Auth
  openingTheGrove: "Opening the Grove…",
  listeningForConfirmation: "Listening for your confirmation…",
  emailMaybeInJunk: "Emails sometimes land in Junk, Spam, or Promotions.",
  linkRested: "This link has rested too long",
  resendConfirmation: "Send a fresh link",

  // Encounter outcomes
  seedPlanted: "Your seed has been planted 🌱",
  whisperRooted: "Your whisper has rooted",
  whisperCouldNotRoot: "This whisper could not take root yet",
  checkInWelcomed: "The canopy welcomes you",

  // Distance / proximity
  comeCloser: "Come a little closer to this tree",
  tooFarSoftly: "You're not quite within reach of this tree yet",
} as const;

export type CopyKey = keyof typeof copy;

/**
 * Map a structured failure reason to warm, user-facing copy.
 * Unknown reasons fall back to a generic warm message.
 */
export function explainFailure(reason?: string | null): {
  title: string;
  description?: string;
} {
  switch (reason) {
    case "geo_denied":
      return { title: copy.gpsDenied };
    case "geo_timeout":
    case "geo_unavailable":
      return {
        title: copy.seekingRoots,
        description: copy.signalUncertain,
      };
    case "geo_poor_accuracy":
      return {
        title: copy.signalUncertain,
        description: copy.stepIntoClearSky,
      };
    case "too_far":
      return {
        title: copy.tooFarSoftly,
        description: copy.comeCloser,
      };
    case "override_too_far":
      return {
        title: copy.tooFarSoftly,
        description: "Even with an approximate location, this tree is out of reach right now.",
      };
    case "override_disabled":
      return {
        title: copy.couldNotTakeRoot,
        description: "Approximate-location encounters are paused for now.",
      };
    case "daily_limit":
      return {
        title: "You've offered enough today 🌿",
        description: "Rest now — more becomes possible tomorrow.",
      };
    case "tree_missing":
      return {
        title: copy.couldNotTakeRoot,
        description: "We couldn't find this tree just now. Try again in a moment.",
      };
    case "rpc_error":
    case "network_error":
      return {
        title: copy.couldNotTakeRoot,
        description: copy.tryAgainSoftly,
      };
    default:
      return { title: copy.couldNotTakeRoot, description: copy.tryAgainSoftly };
  }
}
