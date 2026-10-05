/**
 * Confirmed public invitation only; does not create or rewrite a Council record.
 * Schedule and recurring room: Circle 235 manifest 235.6.0, fire / join_link,
 * confirmed by TEOTAG on 4 October 2026.
 * TETOL URL: verified publication supplied by TEOTAG; publication stays frozen.
 */
export const CIRCLE_235_DOORWAY = {
  circleId: "council-of-life/circle-235",
  title: "Circle 235 · yOur Blooming Week",
  date: "Tuesday 6 October 2026",
  time: "7:30–8:30 PM UK · Europe/London",
  startsAt: "2026-10-06T19:30:00+01:00",
  endsAt: "2026-10-06T20:30:00+01:00",
  joinUrl: "https://meet.google.com/zkp-tuue-ima",
  tetolUrl: "https://claude.ai/artifact/HUV71pN5eQSLyVJyrKmQPK",
} as const;

/** An elapsed schedule is not evidence that the Fire was held or harvested. */
export function circle235IsUpcoming(now = new Date()): boolean {
  return now.getTime() < Date.parse(CIRCLE_235_DOORWAY.endsAt);
}
