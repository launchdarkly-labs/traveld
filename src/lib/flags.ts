/**
 * Flag keys match LaunchDarkly dashboard (kebab-case).
 * LDProvider is configured with useCamelCaseFlagKeys: false.
 */
export const FLAG_KEYS = {
  /** Multivariate string: anonymous article access (see `readPayWallMode`). */
  payWall: "pay-wall",
  freeDailyArticleLimit: "free-daily-article-limit",
  upgradeMessaging: "upgrade-messaging",
  checkoutLayout: "checkout-layout",
  /** Boolean: show the in-app LD Admin debug panel. */
  ldAdminPanel: "traveld-ld-admin",
  /** Boolean: load the LaunchDarkly developer toolbar in local development. */
  ldDevToolbar: "traveld-ld-dev-toolbar",
  /** Boolean: tile grid on /articles instead of stacked rows. */
  allArticlesTileLayout: "all-articles-tile-layout",
} as const;

/** Values must match LaunchDarkly variation payloads (snake_case recommended). */
export type PayWallMode = "no_paywall" | "hide_full_article" | "hide_partial_article";

export type DailyLimitVariation = "control" | "limit_2_per_day";
export type MessagingVariation = "default" | "urgency" | "social_proof";

export const DEFAULT_FLAGS: Record<string, unknown> = {
  [FLAG_KEYS.payWall]: "no_paywall" satisfies PayWallMode,
  [FLAG_KEYS.freeDailyArticleLimit]: "control" satisfies DailyLimitVariation,
  [FLAG_KEYS.upgradeMessaging]: "default" satisfies MessagingVariation,
  [FLAG_KEYS.checkoutLayout]: false,
  [FLAG_KEYS.ldAdminPanel]: false,
  [FLAG_KEYS.ldDevToolbar]: false,
  [FLAG_KEYS.allArticlesTileLayout]: false,
};

/** Accepts LD string values plus common human labels if configured that way. */
export function readPayWallMode(value: unknown): PayWallMode {
  if (
    value === "hide_full_article" ||
    value === "Hide Full Article" ||
    value === "hide-full-article"
  ) {
    return "hide_full_article";
  }
  if (
    value === "hide_partial_article" ||
    value === "Hide Partial Article" ||
    value === "hide-partial-article"
  ) {
    return "hide_partial_article";
  }
  if (
    value === "no_paywall" ||
    value === "no paywall" ||
    value === "No paywall" ||
    value === "none"
  ) {
    return "no_paywall";
  }
  return "no_paywall";
}

export function readDailyLimitVariation(value: unknown): DailyLimitVariation {
  if (value === "limit_2_per_day" || value === "control") {
    return value;
  }
  return "control";
}

export function readMessagingVariation(value: unknown): MessagingVariation {
  if (value === "urgency" || value === "social_proof" || value === "default") {
    return value;
  }
  return "default";
}
