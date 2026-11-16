// Blog index — articles, newsletters and case studies from content/blog/.
// Filter with ?type=article|newsletter|case-study and ?tag=<tag>.

import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Rss, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { posts, TYPE_LABELS, type PostType } from '@/lib/blog';
import PostCard from '@/components/blog/PostCard';

type Filter = PostType | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'article', label: 'Articles' },
  { key: 'newsletter', label: 'Newsletters' },
  { key: 'case-study', label: 'Case studies' },
];

const EMPTY: Record<Filter, string> = {
  all: 'No posts yet.',
  article: 'No articles yet.',
  newsletter: 'No newsletters yet — the first issue is on its way.',
  'case-study': 'No case studies yet.',
};

const Blog = () => {
  const [params, setParams] = useSearchParams();
  const typeParam = params.get('type');
  const type: Filter = FILTERS.some((f) => f.key === typeParam) ? (typeParam as Filter) : 'all';
  const tag = params.get('tag');

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: posts.length, article: 0, newsletter: 0, 'case-study': 0 };
    for (const p of posts) c[p.type]++;
    return c;
  }, []);

  const shown = posts.filter((p) => (type === 'all' || p.type === type) && (!tag || p.tags.includes(tag)));
  // Lead with the newest featured post (or simply the newest) when unfiltered.
  const lead = !tag ? shown.find((p) => p.featured) ?? shown[0] : undefined;
  const rest = shown.filter((p) => p !== lead);

  const setFilter = (key: Filter) => {
    const next = new URLSearchParams(params);
    if (key === 'all') next.delete('type');
    else next.set('type', key);
    setParams(next, { replace: true });
  };

  const clearTag = () => {
    const next = new URLSearchParams(params);
    next.delete('tag');
    setParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b-[3px] border-ink bg-tint-yellow/50 py-10 sm:py-14">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <p className="font-mono text-sm font-bold uppercase tracking-widest text-primary">GEODHA Blog</p>
            <h1 className="text-4xl font-black leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
              Stories from the ground.
            </h1>
            <p className="text-lg text-muted-foreground sm:text-xl">
              Articles, newsletters and case studies on civic action, waste and cleaner cities — what we're
              learning and what's changing.
            </p>
            <a
              href="/blog/rss.xml"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground/70 hover:text-primary"
            >
              <Rss className="h-4 w-4" /> Subscribe via RSS
            </a>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-10">
        <div className="container px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Post type">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={type === f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'rounded-full border-[2.5px] border-ink px-4 py-1.5 text-sm font-bold transition-colors',
                  type === f.key ? 'bg-ink text-paper' : 'bg-paper hover:bg-tint-yellow',
                )}
              >
                {f.label}
                <span className={cn('ml-1.5 font-mono text-xs', type === f.key ? 'text-paper/70' : 'text-muted-foreground')}>
                  {counts[f.key]}
                </span>
              </button>
            ))}
            {tag && (
              <button
                type="button"
                onClick={clearTag}
                className="inline-flex items-center gap-1 rounded-full border-[2.5px] border-dashed border-ink bg-tint-blue px-3 py-1.5 text-sm font-bold"
                aria-label={`Remove tag filter ${tag}`}
              >
                Tag: {tag} <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {shown.length === 0 ? (
            <div className="rounded-2xl border-[3px] border-dashed border-ink/40 p-10 text-center">
              <p className="text-lg font-semibold">{tag ? `No ${type === 'all' ? 'posts' : TYPE_LABELS[type as PostType].toLowerCase() + 's'} tagged “${tag}”.` : EMPTY[type]}</p>
              <p className="mt-2 text-muted-foreground">
                Want to contribute a story? Write to{' '}
                <a href="mailto:contact@geodha.org" className="font-semibold text-primary underline">
                  contact@geodha.org
                </a>
                .
              </p>
            </div>
          ) : (
            <>
              {lead && <PostCard post={lead} lead />}
              {rest.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((p) => (
                    <PostCard key={p.slug} post={p} />
                  ))}
                </div>
              )}
            </>
          )}

          <p className="pt-4 text-sm text-muted-foreground">
            Part of the GEODHA team?{' '}
            <a href="/cms/" className="font-semibold text-primary underline">
              Write or edit posts
            </a>{' '}
            · <Link to="/about" className="underline">About GEODHA</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Blog;
