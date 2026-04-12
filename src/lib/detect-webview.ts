/**
 * Detect if running inside an in-app browser (Telegram, Instagram, etc.)
 * and provide helpers for guiding users to a full browser.
 */

export function isTelegramWebview(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /TelegramBot|Telegram/i.test(ua) || /\bTg[A-Z]/i.test(ua);
}

export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // Telegram, Instagram, Facebook, LINE, WeChat, Twitter/X
  return /Telegram|Instagram|FBAN|FBAV|Line\/|MicroMessenger|Twitter/i.test(ua)
    || /\bTg[A-Z]/i.test(ua);
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** Preferred external browser name for the user's platform */
export function externalBrowserName(): string {
  return isIOS() ? "Safari" : "your browser";
}
