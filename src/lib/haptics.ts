/**
 * Lightweight haptic feedback utility.
 * Uses the Vibration API where available, degrades silently.
 */

const canVibrate = typeof navigator !== "undefined" && "vibrate" in navigator;

/** Light tap — 10ms */
export function hapticTap() {
  if (canVibrate) navigator.vibrate(10);
}

/** Medium feedback — 20ms */
export function hapticMedium() {
  if (canVibrate) navigator.vibrate(20);
}

/** Success pattern — short-pause-short */
export function hapticSuccess() {
  if (canVibrate) navigator.vibrate([15, 50, 15]);
}
