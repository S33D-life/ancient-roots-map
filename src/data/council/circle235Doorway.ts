import { CURRENT_CIRCLE } from "../../../supabase/functions/_shared/currentCircle";
/** Compatibility adapter; Current Circle is the sole approved public source. */
export const CIRCLE_235_DOORWAY = {
  ...CURRENT_CIRCLE,
  tetolUrl: new URL(CURRENT_CIRCLE.links.tetol.url).pathname,
  groupUrl: CURRENT_CIRCLE.links.group.url,
} as const;
