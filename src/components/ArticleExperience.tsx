"use client";

import Link from "next/link";
import { useLDClient, useFlags } from "launchdarkly-react-client-sdk";
import { useEffect, useMemo, useRef } from "react";
import { flattenArticleBody, type Article } from "@/lib/articles";
import { evaluateArticlePolicy } from "@/lib/article-policy";
import { DEFAULT_FLAGS } from "@/lib/flags";
import { getGateMessaging, getUpgradeLimitCopy } from "@/lib/messaging";
import { recordFullView } from "@/lib/article-views";
import { useSession } from "@/context/session";
import { trackSafe } from "@/lib/track";
import { ArticleLdSkeleton } from "@/components/ArticleLdSkeleton";
import { hasLaunchDarklyClientId } from "@/components/LaunchDarklyWrapper";

const HAS_LD = hasLaunchDarklyClientId();

function ArticleBreadcrumbs({ title }: { title: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--travel-muted)]">
        <li>
          <Link href="/" className="transition hover:text-[var(--travel-ink)]">
            Home
          </Link>
        </li>
        <li aria-hidden className="select-none text-[var(--travel-border)]">
          /
        </li>
        <li>
          <Link href="/articles" className="transition hover:text-[var(--travel-ink)]">
            Articles
          </Link>
        </li>
        <li aria-hidden className="select-none text-[var(--travel-border)]">
          /
        </li>
        <li className="min-w-0 max-w-full">
          <span
            className="line-clamp-2 font-medium text-[var(--travel-ink)]"
            aria-current="page"
          >
            {title}
          </span>
        </li>
      </ol>
    </nav>
  );
}

function ArticleSections({ sections }: { sections: Article["sections"] }) {
  return (
    <div className="mt-10 space-y-12">
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-24">
          <h2 className="border-b border-[var(--travel-border)] pb-3 font-serif text-2xl font-semibold text-[var(--travel-ink)]">
            {section.title}
          </h2>
          <div className="mt-4 space-y-4 text-[var(--travel-ink)]">
            {section.body.split("\n\n").map((para, j) => (
              <p key={j}>{para}</p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

type Props = { article: Article };

export function ArticleExperience(props: Props) {
  if (HAS_LD) {
    return <ArticleExperienceWithLd {...props} />;
  }
  return <ArticleExperienceNoLd {...props} />;
}

function ArticleExperienceNoLd({ article }: Props) {
  const session = useSession();
  const policy = useMemo(
    () =>
      evaluateArticlePolicy({
        flags: DEFAULT_FLAGS,
        effectiveTier: session.effectiveTier,
        userIdForLimit: session.user?.id ?? null,
        slug: article.slug,
      }),
    [article.slug, session.effectiveTier, session.user?.id],
  );
  return (
    <ArticleBody
      article={article}
      policy={policy}
      ldClient={undefined}
      flagsLabel="fallback defaults (no client id)"
    />
  );
}

function ArticleExperienceWithLd({ article }: Props) {
  const flags = useFlags();
  const ldClient = useLDClient();
  const session = useSession();

  const policy = useMemo(
    () =>
      evaluateArticlePolicy({
        flags,
        effectiveTier: session.effectiveTier,
        userIdForLimit: session.user?.id ?? null,
        slug: article.slug,
      }),
    [flags, article.slug, session.effectiveTier, session.user?.id],
  );

  if (!ldClient) {
    return <ArticleLdSkeleton article={article} />;
  }

  return (
    <ArticleBody
      article={article}
      policy={policy}
      ldClient={ldClient}
      flagsLabel="live client"
    />
  );
}

function ArticleBody({
  article,
  policy,
  ldClient,
  flagsLabel,
}: Props & {
  policy: ReturnType<typeof evaluateArticlePolicy>;
  ldClient: ReturnType<typeof useLDClient>;
  flagsLabel: string;
}) {
  const session = useSession();
  const articleViewKey = useRef<string | null>(null);
  const paywallShownKey = useRef<string | null>(null);
  const limitPromptKey = useRef<string | null>(null);
  const fullViewRecorded = useRef(false);

  useEffect(() => {
    if (!session.ready || !ldClient) return;
    if (!policy.showSignupGate && !policy.showPreviewTeaser) return;
    const k = `${article.slug}:${policy.payWall}`;
    if (paywallShownKey.current === k) return;
    paywallShownKey.current = k;
    trackSafe(ldClient, "paywall_shown", { slug: article.slug });
  }, [
    article.slug,
    ldClient,
    policy.payWall,
    policy.showPreviewTeaser,
    policy.showSignupGate,
    session.ready,
  ]);

  useEffect(() => {
    if (!session.ready) return;
    if (!policy.limitReached || !ldClient) return;
    const k = `${article.slug}:daily_limit`;
    if (limitPromptKey.current === k) return;
    limitPromptKey.current = k;
    trackSafe(ldClient, "daily_limit_reached", { slug: article.slug });
    trackSafe(ldClient, "upgrade_prompt_shown", {
      reason: "daily_limit",
      slug: article.slug,
    });
  }, [article.slug, ldClient, policy.limitReached, session.ready]);

  useEffect(() => {
    if (!session.ready) return;
    const surface = policy.surface;
    const k = `${article.slug}:${surface}`;
    if (articleViewKey.current === k) return;
    articleViewKey.current = k;
    trackSafe(ldClient, "article_view", {
      slug: article.slug,
      surface,
      pay_wall: policy.payWall,
      user_tier: session.effectiveTier,
      source: flagsLabel,
    });
  }, [
    article.slug,
    flagsLabel,
    ldClient,
    policy.payWall,
    policy.surface,
    session.effectiveTier,
    session.ready,
  ]);

  useEffect(() => {
    if (!session.ready) return;
    if (!policy.countsAsFullView) return;
    if (policy.surface === "limit" || policy.surface === "blocked") return;
    if (session.user?.tier !== "free") return;
    if (policy.dailyLimit !== "limit_2_per_day") return;
    if (fullViewRecorded.current) return;
    fullViewRecorded.current = true;
    recordFullView(session.user.id, article.slug);
  }, [
    article.slug,
    policy.countsAsFullView,
    policy.dailyLimit,
    policy.surface,
    session.ready,
    session.user,
  ]);

  const gateCopy =
    policy.limitReached && session.user?.tier === "free"
      ? getUpgradeLimitCopy(policy.messaging)
      : getGateMessaging(policy.messaging);

  const articleReturnPath = `/articles/${article.slug}`;
  const signupFromArticleHref = `/signup?returnTo=${encodeURIComponent(articleReturnPath)}`;
  const loginFromArticleHref = `/login?returnTo=${encodeURIComponent(articleReturnPath)}`;

  useEffect(() => {
    fullViewRecorded.current = false;
  }, [article.slug]);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 text-[var(--travel-ink)]">
      <ArticleBreadcrumbs title={article.title} />
      <p className="text-xs uppercase tracking-wide text-[var(--travel-muted)]">
        {article.tags.join(" · ")}
      </p>
      <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-[var(--travel-ink)] sm:text-4xl">
        {article.title}
      </h1>
      <p className="mt-4 text-sm text-[var(--travel-muted)]">
        {article.author} · {new Date(article.date).toLocaleDateString()}
      </p>

      {policy.limitReached ? (
        <div className="mt-8 rounded-2xl border border-amber-500/35 bg-amber-950/30 p-6 text-amber-50">
          <h2 className="text-lg font-semibold text-amber-50">{gateCopy.title}</h2>
          <p className="mt-2 text-sm text-amber-100/85">{gateCopy.body}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/upgrade"
              className="inline-flex rounded-full bg-gradient-to-r from-[var(--travel-sea-deep)] to-[var(--travel-sea)] px-4 py-2 text-sm font-medium text-white shadow-[0_0_16px_-6px_var(--travel-glow)]"
            >
              {gateCopy.primaryCta}
            </Link>
            <Link
              href="/articles"
              className="text-sm font-medium text-amber-200 underline underline-offset-2 hover:text-white"
            >
              Back to articles
            </Link>
          </div>
        </div>
      ) : policy.showSignupGate ? (
        <div className="mt-8 rounded-2xl border border-[var(--travel-border)] bg-[var(--travel-surface)] p-6">
          <h2 className="text-lg font-semibold text-[var(--travel-ink)]">
            {gateCopy.title}
          </h2>
          <p className="mt-2 text-sm text-[var(--travel-muted)]">{gateCopy.body}</p>
          <div className="mt-4 flex flex-wrap items-center justify-start gap-x-6 gap-y-2">
            <Link
              href={signupFromArticleHref}
              onClick={() => {
                trackSafe(ldClient, "create_account_clicked", {
                  source: "paywall",
                  slug: article.slug,
                });
                trackSafe(ldClient, "paywall_cta_clicked", {
                  slug: article.slug,
                  cta: "signup",
                });
              }}
              className="inline-flex rounded-full bg-gradient-to-r from-[var(--travel-sea-deep)] to-[var(--travel-sea)] px-4 py-2 text-sm font-medium text-white shadow-[0_0_16px_-6px_var(--travel-glow)]"
            >
              {gateCopy.primaryCta}
            </Link>
            <Link
              href={loginFromArticleHref}
              onClick={() =>
                trackSafe(ldClient, "paywall_cta_clicked", {
                  slug: article.slug,
                  cta: "login",
                })
              }
              className="inline-flex items-center rounded-full border border-[var(--travel-border)] px-4 py-2 text-sm font-medium text-[var(--travel-ink)]"
            >
              {gateCopy.secondaryCta ?? "Log in"}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="lead mt-8 text-lg text-[var(--travel-ink)]">{article.intro}</p>

          {policy.showPreviewTeaser && session.effectiveTier === "anonymous" ? (
            <div className="relative mt-6">
              <div className="select-none blur-sm" aria-hidden>
                {flattenArticleBody(article)
                  .split("\n\n")
                  .map((para, i) => (
                    <p key={i} className="text-[var(--travel-muted)]">
                      {para}
                    </p>
                  ))}
              </div>
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-start rounded-2xl bg-gradient-to-b from-[var(--travel-bg)] from-0% via-[var(--travel-bg)]/88 to-transparent to-55% p-4 sm:p-6">
                <div className="pointer-events-auto rounded-2xl border border-[var(--travel-border)] bg-[var(--travel-surface)] p-5 shadow-[0_0_40px_-10px_var(--travel-glow)]">
                  <h3 className="text-base font-semibold text-[var(--travel-ink)]">
                    {gateCopy.title}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--travel-muted)]">
                    {gateCopy.body}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-start gap-x-6 gap-y-2">
                    <Link
                      href={signupFromArticleHref}
                      onClick={() => {
                        trackSafe(ldClient, "create_account_clicked", {
                          source: "paywall",
                          slug: article.slug,
                        });
                trackSafe(ldClient, "paywall_cta_clicked", {
                  slug: article.slug,
                  cta: "signup",
                });
                      }}
                      className="inline-flex items-center rounded-full bg-gradient-to-r from-[var(--travel-sea-deep)] to-[var(--travel-sea)] px-4 py-2 text-sm font-medium text-white shadow-[0_0_16px_-6px_var(--travel-glow)]"
                    >
                      {gateCopy.primaryCta}
                    </Link>
                    <Link
                      href={loginFromArticleHref}
                      onClick={() =>
                        trackSafe(ldClient, "paywall_cta_clicked", {
                          slug: article.slug,
                          cta: "login",
                        })
                      }
                      className="inline-flex items-center text-sm font-medium text-[var(--travel-sea)] underline underline-offset-2"
                    >
                      {gateCopy.secondaryCta ?? "Log in"}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <ArticleSections sections={article.sections} />
          )}
        </>
      )}

      <p className="mt-10 text-xs text-[var(--travel-muted)]">
        Demo instrumentation: {flagsLabel}. Pay wall{" "}
        <code>{policy.payWall}</code>, daily limit{" "}
        <code>{policy.dailyLimit}</code>, messaging{" "}
        <code>{policy.messaging}</code>.
      </p>
    </article>
  );
}
