import companions from "../../../public/council/circle-236/companions.json";
import { THREAD_ROUTES } from "@/data/library/birchThread";

/** Website weekly projection. Historical Circle 235/backend projection is preserved. */
export const CURRENT_WEBSITE_CIRCLE = {
  number: companions.number,
  status: companions.status,
  question: null, // No settled Circle 236 question has been approved.
  companions: companions.companions,
  route: THREAD_ROUTES.circle(companions.number),
} as const;
