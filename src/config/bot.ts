/**
 * Bot / Telegram configuration for handoff link generation and feature gating.
 */

const FALLBACK_BOT_USERNAME = "s33dlifebot";

export const BOT_CONFIG = {
  telegramBotUsername: (import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined) || FALLBACK_BOT_USERNAME,

  /** Whether Telegram bot deep-links are available */
  get hasTelegramBot() {
    return !!this.telegramBotUsername;
  },

  /** Whether Telegram login / account linking UI should be shown */
  get hasTelegramAuth() {
    return !!this.telegramBotUsername;
  },

  /** Generate a t.me deep-link with a start param */
  telegramBotLink(startParam: string) {
    if (!this.telegramBotUsername) return null;
    return `https://t.me/${this.telegramBotUsername}?start=${encodeURIComponent(startParam)}`;
  },
} as const;
