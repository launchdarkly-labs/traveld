"use client";

import { useFlags } from "launchdarkly-react-client-sdk";
import { CreateAccountLink } from "@/components/CreateAccountLink";
import { hasLaunchDarklyClientId } from "@/components/LaunchDarklyWrapper";
import { useSession } from "@/context/session";
import { DEFAULT_FLAGS, FLAG_KEYS } from "@/lib/flags";

const HAS_LD = hasLaunchDarklyClientId();

/**
 * Homepage banner nudging anonymous visitors to sign up for updates.
 * Gated on `homepage-signup-banner`; hidden once logged in.
 */
export function SubscribeBanner() {
  if (!HAS_LD) return null;
  return <SubscribeBannerWithLd />;
}

function SubscribeBannerWithLd() {
  const flags = useFlags();
  const enabled = Boolean(
    flags[FLAG_KEYS.homepageSignupBanner] ??
      DEFAULT_FLAGS[FLAG_KEYS.homepageSignupBanner],
  );
  if (!enabled) return null;
  return <SubscribeBannerInner />;
}

function SubscribeBannerInner() {
  const session = useSession();
  if (!session.ready || session.user) return null;

  return (
    <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-[var(--travel-sea)]/30 bg-[var(--travel-surface)] px-5 py-4 shadow-[0_8px_30px_-12px_var(--travel-glow)] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--travel-ink)]">
        <span className="font-semibold">Never miss a new guide.</span>{" "}
        <span className="text-[var(--travel-muted)]">
          Create a free account to subscribe to updates.
        </span>
      </p>
      <CreateAccountLink
        href="/signup"
        source="home_banner"
        className="shrink-0 self-start rounded-full bg-[var(--travel-sea)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 sm:self-auto"
      >
        Create account
      </CreateAccountLink>
    </div>
  );
}
