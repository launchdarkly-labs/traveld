"use client";

import type { LDClient, LDFlagSet, LDFlagValue } from "launchdarkly-react-client-sdk";
import { useLDClient, useFlags } from "launchdarkly-react-client-sdk";
import { useMemo, useState } from "react";
import { useSession } from "@/context/session";
import { buildLdContext } from "@/lib/ld-context";
import { DEFAULT_FLAGS, FLAG_KEYS } from "@/lib/flags";
import {
  clearDemoTrackEvents,
  useDemoTrackEvents,
} from "@/lib/ld-demo-event-log";

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return String(ts);
  }
}

function stringifyClientContext(client?: LDClient): string | null {
  try {
    const live = client?.getContext?.();
    return live ? JSON.stringify(live, null, 2) : null;
  } catch {
    return null;
  }
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--travel-muted)]">
      {children}
    </h3>
  );
}

function LdAdminPanelBody({
  ldClient,
  flags,
  ldEnabled,
}: {
  ldClient?: LDClient;
  flags?: LDFlagSet;
  ldEnabled: boolean;
}) {
  const {
    anonymousKey,
    user,
    effectiveTier,
    ready,
    regenerateAnonymousLdKey,
  } = useSession();
  const events = useDemoTrackEvents();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const builtContext = useMemo(
    () =>
      buildLdContext({
        anonymousKey: ready ? anonymousKey : "booting",
        user,
      }),
    [anonymousKey, user, ready],
  );

  const clientContextJson = stringifyClientContext(ldClient);
  const builtJson = JSON.stringify(builtContext, null, 2);
  /** SDK `getContext()` is authoritative once the client exists; same data as `buildLdContext` after identify. */
  const evaluationContextJson = clientContextJson ?? builtJson;
  const evaluationContextHelp = ldClient
    ? clientContextJson
      ? "Active evaluation context from the SDK (getContext)."
      : "Showing session-built context — SDK context not available yet."
    : ldEnabled
      ? "Session-built context — LD client still initializing."
      : "Session-built context — no client-side ID configured.";

  const { flagEvaluationsJson, experimentSummary } = useMemo(() => {
    if (!ldClient) {
      return { flagEvaluationsJson: null as string | null, experimentSummary: null as string | null };
    }
    const keys = new Set<string>([
      ...Object.values(FLAG_KEYS),
      ...Object.keys(flags ?? {}),
    ]);
    const payload: Record<string, unknown> = {};
    const inExperimentKeys: string[] = [];
    for (const key of keys) {
      const def = (DEFAULT_FLAGS[key] ?? flags?.[key] ?? false) as LDFlagValue;
      try {
        const d = ldClient.variationDetail(key, def);
        const reason = d.reason ?? null;
        if (reason?.inExperiment === true) inExperimentKeys.push(key);
        payload[key] = {
          value: d.value,
          variationIndex: d.variationIndex,
          reason,
        };
      } catch (e) {
        payload[key] = { error: String(e) };
      }
    }
    const summary =
      inExperimentKeys.length > 0
        ? `inExperiment on: ${inExperimentKeys.join(", ")}`
        : "No flags report inExperiment: true (see per-flag reason in JSON below).";
    return {
      flagEvaluationsJson: JSON.stringify(payload, null, 2),
      experimentSummary: summary,
    };
  }, [ldClient, flags]);

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied("error");
      setTimeout(() => setCopied(null), 2000);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed top-4 right-4 z-[100] rounded-full border border-[var(--travel-border)] bg-[var(--travel-surface)] px-3 py-2 text-xs font-medium text-[var(--travel-ink)] shadow-lg shadow-black/40 transition hover:border-[var(--travel-sea)]/50 hover:text-[var(--travel-sea)]"
        aria-expanded={open}
        aria-controls="ld-admin-panel"
      >
        LD Admin
      </button>

      {open ? (
        <div
          id="ld-admin-panel"
          className="fixed inset-x-3 top-16 z-[100] flex max-h-[min(72vh,560px)] flex-col rounded-xl border border-[var(--travel-border)] bg-[var(--travel-surface)] shadow-2xl shadow-black/50 sm:left-auto sm:right-4 sm:w-[min(100%,420px)]"
          role="dialog"
          aria-label="LaunchDarkly admin"
        >
          <div className="flex items-center justify-between border-b border-[var(--travel-border)] px-4 py-3">
            <span className="text-sm font-semibold text-[var(--travel-ink)]">
              LD Admin
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 text-xs text-[var(--travel-muted)] hover:bg-[var(--travel-sand)] hover:text-[var(--travel-ink)]"
            >
              Close
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3 text-xs">
            {!ldEnabled ? (
              <p className="text-[var(--travel-muted)]">
                No{" "}
                <code className="text-[var(--travel-sea)]">
                  NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID
                </code>
                . Flags and client context below are unavailable; session context
                still updates locally.
              </p>
            ) : !ldClient ? (
              <p className="text-[var(--travel-muted)]">LaunchDarkly client is loading…</p>
            ) : null}

            <div>
              <SectionTitle>Session</SectionTitle>
              <p className="mt-1 text-[var(--travel-muted)]">
                Effective tier:{" "}
                <span className="font-mono text-[var(--travel-ink)]">{effectiveTier}</span>
                {user ? (
                  <>
                    {" "}
                    · logged in as{" "}
                    <span className="font-mono text-[var(--travel-ink)]">{user.email}</span>
                  </>
                ) : null}
              </p>
              <p className="mt-1 break-all text-[var(--travel-muted)]">
                Anonymous key (localStorage, used as LD{" "}
                <code className="text-[var(--travel-sea)]">key</code> when logged out):{" "}
                <span className="font-mono text-[var(--travel-ink)]">{anonymousKey}</span>
              </p>
              <button
                type="button"
                onClick={() => regenerateAnonymousLdKey()}
                disabled={!ready}
                className="mt-2 rounded-md border border-[var(--travel-border)] bg-[var(--travel-input)] px-2 py-1.5 text-[11px] font-medium text-[var(--travel-ink)] transition hover:border-[var(--travel-sea)]/60 disabled:opacity-50"
              >
                Regenerate anonymous key
              </button>
              {user ? (
                <p className="mt-2 text-[var(--travel-muted)]">
                  While signed in, LD context uses your account{" "}
                  <code className="text-[var(--travel-sea)]">key</code> (
                  <span className="font-mono">{user.id}</span>). Regenerate the
                  anonymous key for the next time you log out, or log out now to
                  evaluate as a fresh anonymous user.
                </p>
              ) : (
                <p className="mt-2 text-[var(--travel-muted)]">
                  Regenerating assigns a new LaunchDarkly context key so you can
                  re-roll experiment bucketing without clearing other demo data.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <SectionTitle>LD context</SectionTitle>
                <button
                  type="button"
                  onClick={() => copyText("ctx", evaluationContextJson)}
                  className="shrink-0 rounded border border-[var(--travel-border)] px-2 py-0.5 text-[10px] text-[var(--travel-muted)] hover:text-[var(--travel-ink)]"
                >
                  {copied === "ctx" ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-1 text-[10px] text-[var(--travel-muted)]">{evaluationContextHelp}</p>
              <pre className="mt-1 max-h-36 overflow-auto rounded-lg border border-[var(--travel-border)] bg-[var(--travel-input)] p-2 font-mono text-[10px] leading-relaxed text-[var(--travel-ink)]/90">
                {evaluationContextJson}
              </pre>
            </div>

            {flagEvaluationsJson ? (
              <div>
                <div className="flex items-center justify-between gap-2">
                  <SectionTitle>Flags (LD evaluation)</SectionTitle>
                  <button
                    type="button"
                    onClick={() => copyText("flags", flagEvaluationsJson)}
                    className="shrink-0 rounded border border-[var(--travel-border)] px-2 py-0.5 text-[10px] text-[var(--travel-muted)] hover:text-[var(--travel-ink)]"
                  >
                    {copied === "flags" ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-[var(--travel-muted)]">
                  From <code className="text-[var(--travel-sea)]">variationDetail()</code> — each
                  flag includes <code className="text-[var(--travel-sea)]">reason</code> (when LD
                  returns it). Experiment exposure is{" "}
                  <code className="text-[var(--travel-sea)]">reason.inExperiment</code>.
                </p>
                {experimentSummary ? (
                  <p className="mt-1 font-mono text-[10px] text-[var(--travel-ink)]/90">
                    {experimentSummary}
                  </p>
                ) : null}
                <pre className="mt-1 max-h-48 overflow-auto rounded-lg border border-[var(--travel-border)] bg-[var(--travel-input)] p-2 font-mono text-[10px] leading-relaxed text-[var(--travel-ink)]/90">
                  {flagEvaluationsJson}
                </pre>
              </div>
            ) : ldEnabled && ldClient ? (
              <p className="text-[var(--travel-muted)]">No flag evaluation snapshot yet.</p>
            ) : null}

            <div>
              <div className="flex items-center justify-between gap-2">
                <SectionTitle>Custom events (this tab)</SectionTitle>
                <button
                  type="button"
                  onClick={() => clearDemoTrackEvents()}
                  className="shrink-0 rounded border border-[var(--travel-border)] px-2 py-0.5 text-[10px] text-[var(--travel-muted)] hover:text-[var(--travel-ink)]"
                >
                  Clear
                </button>
              </div>
              {events.length === 0 ? (
                <p className="mt-1 text-[var(--travel-muted)]">
                  None yet — open articles, sign up, or checkout to emit events.
                </p>
              ) : (
                <ul className="mt-1 max-h-40 space-y-1.5 overflow-auto rounded-lg border border-[var(--travel-border)] bg-[var(--travel-input)] p-2 font-mono text-[10px] text-[var(--travel-ink)]/90">
                  {[...events].reverse().map((e, i) => (
                    <li key={`${e.at}-${e.name}-${i}`}>
                      <span className="text-[var(--travel-muted)]">{formatTime(e.at)}</span>{" "}
                      <span className="text-[var(--travel-sea)]">{e.name}</span>
                      {e.data && Object.keys(e.data).length > 0 ? (
                        <span className="text-[var(--travel-muted)]">
                          {" "}
                          {JSON.stringify(e.data)}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function LdAdminWithLd() {
  const flags = useFlags();
  const ldClient = useLDClient();
  if (flags[FLAG_KEYS.ldAdminPanel] !== true) return null;
  return <LdAdminPanelBody ldClient={ldClient} flags={flags} ldEnabled />;
}
