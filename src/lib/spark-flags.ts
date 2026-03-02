/**
 * Spark Feature Flags — progressive enhancement gates.
 * Start conservative on mobile; enable features as they stabilize.
 */

export const SPARK_FLAGS = {
  /** Use the stable (non-draggable on first ship) FAB on mobile */
  SPARK_LITE_DEFAULT_ON: false,
  /** Allow screenshot uploads (auto-disables on error) */
  ENABLE_SCREENSHOTS: true,
  /** Attach device/route diagnostics to reports */
  ENABLE_DIAGNOSTICS: true,
  /** Use Radix Select dropdowns (false = native <select>) */
  ENABLE_HEAVY_SELECTS: false,
  /** Show Spark feed in Council tab (placeholder) */
  ENABLE_SPARK_FEED: false,
  /** framer-motion animations inside BugReportDialog */
  ENABLE_FANCY_ANIMATION: false,
} as const;

export type SparkFlagKey = keyof typeof SPARK_FLAGS;
