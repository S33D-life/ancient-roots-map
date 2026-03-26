/**
 * Bot / Telegram configuration for handoff link generation.
 * Set VITE_TELEGRAM_BOT_USERNAME in env to enable bot deep-links.
 */

export const BOT_CONFIG = {
  telegramBotUsername: import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined,
  /** Whether Telegram bot deep-links are available */
  get hasTelegramBot() {
    return !!this.telegramBotUsername;
  },
  /** Generate a t.me deep-link with a start param */
  telegramBotLink(startParam: string) {
    if (!this.telegramBotUsername) return null;
    return `https://t.me/${this.telegramBotUsername}?start=${encodeURIComponent(startParam)}`;
  },
} as const;
