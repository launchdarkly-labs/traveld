"use client";

import Link from "next/link";
import { useFlags } from "launchdarkly-react-client-sdk";
import { useMemo, useState } from "react";
import { hasLaunchDarklyClientId } from "@/components/LaunchDarklyWrapper";
import { DEFAULT_FLAGS, FLAG_KEYS } from "@/lib/flags";

const HAS_LD = hasLaunchDarklyClientId();

export type ArticleListItem = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
};

type Props = { articles: ArticleListItem[] };

export function ArticlesIndex({ articles }: Props) {
  if (HAS_LD) return <ArticlesIndexWithLd articles={articles} />;
  return <ArticlesIndexInner articles={articles} tileLayout={false} />;
}

function ArticlesIndexWithLd({ articles }: Props) {
  const flags = useFlags();
  const tileLayout = Boolean(
    flags[FLAG_KEYS.allArticlesTileLayout] ??
      DEFAULT_FLAGS[FLAG_KEYS.allArticlesTileLayout],
  );
  return <ArticlesIndexInner articles={articles} tileLayout={tileLayout} />;
}

function ArticlesIndexInner({ articles, tileLayout }: Props & { tileLayout: boolean }) {
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    for (const a of articles) for (const t of a.tags) s.add(t);
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [articles]);

  const filtered =
    activeTags.length === 0
      ? articles
      : articles.filter((a) => activeTags.some((t) => a.tags.includes(t)));

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const clearTags = () => setActiveTags([]);

  const rowLinkClass =
    "flex flex-col rounded-2xl border border-[var(--travel-border)] bg-[var(--travel-surface)] px-5 py-4 transition hover:border-[var(--travel-sea)]/50 hover:shadow-[0_0_24px_-8px_var(--travel-glow)] sm:flex-row sm:items-center sm:justify-between";

  const tileLinkClass =
    "flex h-full min-h-[12rem] flex-col rounded-2xl border border-[var(--travel-border)] bg-[var(--travel-surface)] p-5 transition hover:border-[var(--travel-sea)]/50 hover:shadow-[0_0_24px_-8px_var(--travel-glow)]";

  return (
    <>
      <div className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-full text-xs font-semibold uppercase tracking-wide text-[var(--travel-muted)] sm:w-auto">
            Filter by tag
          </span>
          <button
            type="button"
            onClick={clearTags}
            aria-pressed={activeTags.length === 0}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              activeTags.length === 0
                ? "border-[var(--travel-sea)]/50 bg-[var(--travel-sea)]/15 text-[var(--travel-ink)]"
                : "border-[var(--travel-border)] text-[var(--travel-muted)] hover:border-[var(--travel-sea)]/40 hover:text-[var(--travel-ink)]"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => {
            const on = activeTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={on}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  on
                    ? "border-[var(--travel-sea)]/50 bg-[var(--travel-sea)]/15 text-[var(--travel-ink)]"
                    : "border-[var(--travel-border)] text-[var(--travel-muted)] hover:border-[var(--travel-sea)]/40 hover:text-[var(--travel-ink)]"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
        {activeTags.length > 0 ? (
          <p className="mt-3 text-xs text-[var(--travel-muted)]">
            Showing articles tagged{" "}
            <span className="text-[var(--travel-ink)]">{activeTags.join(", ")}</span>
            {activeTags.length > 1 ? " (any match)" : ""}.{" "}
            <button
              type="button"
              onClick={clearTags}
              className="font-medium text-[var(--travel-sea)] underline-offset-2 hover:underline"
            >
              Clear
            </button>
          </p>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-sm text-[var(--travel-muted)]">
          No articles match this combination.{" "}
          <button
            type="button"
            onClick={clearTags}
            className="font-medium text-[var(--travel-sea)] underline-offset-2 hover:underline"
          >
            Reset filters
          </button>
        </p>
      ) : (
        <ul
          className={
            tileLayout
              ? "mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "mt-10 space-y-4"
          }
        >
          {filtered.map((a) => (
            <li key={a.slug} className={tileLayout ? "flex min-h-0" : undefined}>
              <Link
                href={`/articles/${a.slug}`}
                className={tileLayout ? `${tileLinkClass} w-full` : rowLinkClass}
              >
                {tileLayout ? (
                  <div className="flex min-h-0 flex-1 flex-col">
                    <p className="text-xs text-[var(--travel-muted)]">{a.tags.join(" · ")}</p>
                    <h2 className="mt-1 line-clamp-2 font-serif text-lg font-semibold text-[var(--travel-ink)]">
                      {a.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-[var(--travel-muted)]">
                      {a.excerpt}
                    </p>
                    <span className="mt-4 text-xs text-[var(--travel-muted)]">
                      {new Date(a.date).toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-xs text-[var(--travel-muted)]">{a.tags.join(" · ")}</p>
                      <h2 className="mt-1 font-serif text-xl font-semibold text-[var(--travel-ink)]">
                        {a.title}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--travel-muted)]">{a.excerpt}</p>
                    </div>
                    <span className="mt-3 text-xs text-[var(--travel-muted)] sm:mt-0 sm:pl-6">
                      {new Date(a.date).toLocaleDateString()}
                    </span>
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
