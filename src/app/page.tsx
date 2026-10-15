import Link from "next/link";
import { HeroSignupCta } from "@/components/HeroSignupCta";
import { SubscribeBanner } from "@/components/SubscribeBanner";
import { getAllArticles } from "@/lib/articles";

export default function Home() {
  const articles = getAllArticles();
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <SubscribeBanner />
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1e1048] via-[var(--travel-sea-deep)] to-[#0a1628] p-10 text-white shadow-[0_0_60px_-12px_var(--travel-glow)]">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--travel-sea)]/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-96 rounded-full bg-[#3d5eff]/20 blur-3xl"
          aria-hidden
        />
        <p className="relative text-sm font-medium uppercase tracking-widest text-white/75">
          Curated travel guides
        </p>
        <h1 className="relative mt-3 max-w-2xl font-serif text-4xl font-semibold leading-tight sm:text-5xl">
          Guides for travelers who'd rather stay curious than stay on schedule.
        </h1>
        <div className="relative mt-8 flex flex-wrap gap-3">
          <Link
            href="/articles"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#14101f] shadow-lg transition hover:bg-white/95"
          >
            Browse articles
          </Link>
          <HeroSignupCta />
        </div>
      </section>

      {featured ? (
        <section className="mt-14">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--travel-muted)]">
            Featured
          </h2>
          <Link
            href={`/articles/${featured.slug}`}
            className="mt-3 block rounded-2xl border border-[var(--travel-border)] bg-[var(--travel-surface)] p-6 transition hover:border-[var(--travel-sea)]/40 hover:shadow-[0_8px_30px_-8px_var(--travel-glow)]"
          >
            <p className="text-xs text-[var(--travel-muted)]">
              {featured.tags.join(" · ")}
            </p>
            <h3 className="mt-2 font-serif text-2xl font-semibold text-[var(--travel-ink)]">
              {featured.title}
            </h3>
            <p className="mt-2 text-sm text-[var(--travel-muted)]">{featured.excerpt}</p>
            <p className="mt-4 text-xs text-[var(--travel-muted)]">
              {featured.author} · {new Date(featured.date).toLocaleDateString()}
            </p>
          </Link>
        </section>
      ) : null}

      <section className="mt-14">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--travel-muted)]">
          Latest guides
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {rest.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/articles/${a.slug}`}
                className="block h-full rounded-2xl border border-[var(--travel-border)] bg-[var(--travel-surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--travel-sea)]/40 hover:shadow-[0_8px_30px_-8px_var(--travel-glow)]"
              >
                <p className="text-xs text-[var(--travel-muted)]">{a.tags[0]}</p>
                <h3 className="mt-2 font-serif text-lg font-semibold text-[var(--travel-ink)]">
                  {a.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-[var(--travel-muted)]">
                  {a.excerpt}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
