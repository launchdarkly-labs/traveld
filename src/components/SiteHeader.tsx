"use client";

import Link from "next/link";
import { useFlags } from "launchdarkly-react-client-sdk";
import { useEffect, useRef, useState } from "react";
import { CreateAccountLink } from "@/components/CreateAccountLink";
import { hasLaunchDarklyClientId } from "@/components/LaunchDarklyWrapper";
import { useSession } from "@/context/session";
import { DEFAULT_FLAGS, FLAG_KEYS } from "@/lib/flags";

const HAS_LD = hasLaunchDarklyClientId();

function ProfileMenu() {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!session.user) return null;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--travel-border)] bg-[var(--travel-input)] text-[var(--travel-ink)] transition hover:border-[var(--travel-sea)]/50 hover:bg-[var(--travel-surface)]"
      >
        <svg
          className="h-5 w-5 text-[var(--travel-muted)]"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
        </svg>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 min-w-[11rem] rounded-xl border border-[var(--travel-border)] bg-[var(--travel-surface)] py-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)]"
        >
          <Link
            role="menuitem"
            href="/account"
            className="block px-4 py-2.5 text-sm text-[var(--travel-ink)] hover:bg-[var(--travel-input)]"
            onClick={() => setOpen(false)}
          >
            Account
          </Link>
          <button
            type="button"
            role="menuitem"
            className="w-full px-4 py-2.5 text-left text-sm text-[var(--travel-ink)] hover:bg-[var(--travel-input)]"
            onClick={() => {
              setOpen(false);
              session.logout();
            }}
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}

const CREATE_ACCOUNT_DEFAULT_CLASS =
  "rounded-full bg-gradient-to-r from-[var(--travel-sea-deep)] to-[var(--travel-sea)] px-4 py-2 text-sm font-medium text-white shadow-[0_0_20px_-4px_var(--travel-glow)] transition hover:brightness-110";
const CREATE_ACCOUNT_RED_CLASS =
  "rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500";

export function SiteHeader() {
  if (HAS_LD) return <SiteHeaderWithLd />;
  return <SiteHeaderInner sticky={false} redCreateAccount={false} />;
}

function SiteHeaderWithLd() {
  const flags = useFlags();
  const sticky = Boolean(
    flags[FLAG_KEYS.stickyTopNav] ?? DEFAULT_FLAGS[FLAG_KEYS.stickyTopNav],
  );
  const redCreateAccount = Boolean(
    flags[FLAG_KEYS.redCreateAccountButton] ??
      DEFAULT_FLAGS[FLAG_KEYS.redCreateAccountButton],
  );
  return (
    <SiteHeaderInner sticky={sticky} redCreateAccount={redCreateAccount} />
  );
}

function SiteHeaderInner({
  sticky,
  redCreateAccount,
}: {
  sticky: boolean;
  redCreateAccount: boolean;
}) {
  const session = useSession();

  return (
    <header
      className={`${sticky ? "sticky top-0 z-40 " : ""}border-b border-[var(--travel-border)] bg-[var(--travel-surface)]/80 backdrop-blur-md`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-4 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-6 sm:gap-10">
          <Link
            href="/"
            className="group flex shrink-0 items-baseline gap-0.5 font-semibold tracking-tight text-[var(--travel-ink)]"
          >
            <span>Trave</span>
            <span className="bg-gradient-to-r from-[#9d8cff] to-[var(--travel-sea)] bg-clip-text text-transparent">
              LD
            </span>
          </Link>
          <nav
            aria-label="Primary"
            className="min-w-0 border-l border-[var(--travel-border)] pl-6 sm:pl-8"
          >
            <Link
              href="/articles"
              className="text-sm font-medium text-[var(--travel-muted)] transition hover:text-[var(--travel-ink)]"
            >
              Articles
            </Link>
          </nav>
        </div>
        <div className="flex shrink-0 items-center justify-end">
          {!session.ready ? (
            <div
              className="h-9 w-9 rounded-full bg-[var(--travel-sand)]"
              aria-hidden
            />
          ) : session.user ? (
            <ProfileMenu />
          ) : (
            <CreateAccountLink
              href="/signup"
              source="header"
              className={
                redCreateAccount
                  ? CREATE_ACCOUNT_RED_CLASS
                  : CREATE_ACCOUNT_DEFAULT_CLASS
              }
            >
              Create Account
            </CreateAccountLink>
          )}
        </div>
      </div>
    </header>
  );
}
