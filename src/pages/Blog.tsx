import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PenLine, Github } from 'lucide-react';
import { POSTS, ALL_TAGS, formatPostDate } from '@/lib/blog';
import type { BlogPost } from '@/lib/blog';
import { GITHUB_REPO_URL } from '@/config/community';

// Blog index — Markdown posts from /content/blog (edited via Decap CMS at /cms).

function PostMeta({ post }: { post: BlogPost }) {
  return (
    <p className="mono-label !text-[11px]">
      {formatPostDate(post.date)} · {post.readMins} min read
    </p>
  );
}

function TagChips({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span key={t} className="text-[11px] font-bold rounded-full px-2.5 py-0.5 border-2 border-ink/20 bg-paper">
          #{t}
        </span>
      ))}
    </div>
  );
}

function FeaturedPost({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group grid md:grid-cols-2 bg-paper border-[3px] border-ink rounded-2xl overflow-hidden transition-transform hover:-translate-y-0.5"
      style={{ boxShadow: 'var(--shadow-offset-6)' }}
    >
      <div className="bg-stripes-yellow min-h-[180px] md:min-h-[280px] border-b-[3px] md:border-b-0 md:border-r-[3px] border-ink relative">
        {post.cover && (
          <img src={post.cover} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        )}
        <span className="absolute top-4 left-4 bg-ink text-white font-mono text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
          Latest
        </span>
      </div>
      <div className="p-6 sm:p-8 flex flex-col gap-3">
        <PostMeta post={post} />
        <h2 className="text-2xl sm:text-3xl font-black tracking-[-0.02em] leading-tight group-hover:text-primary transition-colors">
          {post.title}
        </h2>
        {post.summary && <p className="text-foreground/70 font-medium leading-relaxed">{post.summary}</p>}
        <TagChips tags={post.tags} />
        <span className="mt-auto pt-2 inline-flex items-center gap-1.5 font-extrabold text-sm">
          Read the post <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col bg-paper border-[3px] border-ink rounded-2xl overflow-hidden transition-transform hover:-translate-y-0.5"
      style={{ boxShadow: 'var(--shadow-offset-4)' }}
    >
      {post.cover && (
        <img src={post.cover} alt="" className="h-40 w-full object-cover border-b-[3px] border-ink" loading="lazy" />
      )}
      <div className="p-5 flex flex-col gap-2.5 flex-1">
        <PostMeta post={post} />
        <h3 className="text-lg font-extrabold leading-snug group-hover:text-primary transition-colors">{post.title}</h3>
        {post.summary && <p className="text-sm text-foreground/70 leading-relaxed line-clamp-3">{post.summary}</p>}
        <div className="mt-auto pt-1"><TagChips tags={post.tags} /></div>
      </div>
    </Link>
  );
}

const Blog = () => {
  const [tag, setTag] = useState<string | null>(null);
  const posts = useMemo(() => (tag ? POSTS.filter((p) => p.tags.includes(tag)) : POSTS), [tag]);
  const [featured, ...rest] = posts;

  const chip = (active: boolean) =>
    `text-xs font-bold rounded-full px-3.5 py-1.5 border-2 border-ink transition-colors ${
      active ? 'bg-ink text-white' : 'bg-paper hover:bg-tint-yellow'
    }`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-paper border-b-[3px] border-ink py-10 sm:py-14">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-5xl">
          <p className="mono-label mb-3">Field notes · Bengaluru</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-[-0.03em] mb-3">The GEODHA Blog</h1>
          <p className="text-foreground/70 font-medium max-w-2xl">
            Waste management, circular economy and civic-data stories — written by volunteers,
            residents and partners. Anyone can pitch a post.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-12">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-5xl space-y-8">
          {ALL_TAGS.length > 0 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter posts by tag">
              <button className={chip(tag === null)} onClick={() => setTag(null)}>All posts</button>
              {ALL_TAGS.map((t) => (
                <button key={t} className={chip(tag === t)} onClick={() => setTag(tag === t ? null : t)}>
                  #{t}
                </button>
              ))}
            </div>
          )}

          {featured ? (
            <>
              <FeaturedPost post={featured} />
              {rest.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map((p) => <PostCard key={p.slug} post={p} />)}
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground py-16">No posts yet — check back soon.</p>
          )}

          {/* Write for us */}
          <div
            className="bg-tint-green border-[3px] border-ink rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-5"
            style={{ boxShadow: 'var(--shadow-offset-4)' }}
          >
            <div className="flex-1 space-y-1.5">
              <p className="mono-label text-primary">Write for GEODHA</p>
              <h2 className="text-xl font-extrabold">Have a ward story, dataset or idea to share?</h2>
              <p className="text-sm text-foreground/70 font-medium leading-relaxed">
                Contributors can draft posts in our editor (GitHub login) — drafts go through review
                before they're published. Or just email us your pitch.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              <a href="/cms/" className="btn-poster inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm !py-2.5 !px-5">
                <PenLine className="h-4 w-4" /> Open editor
              </a>
              <a
                href={`${GITHUB_REPO_URL}/tree/main/content/blog`}
                target="_blank" rel="noopener noreferrer"
                className="btn-poster inline-flex items-center gap-2 bg-paper text-sm !py-2.5 !px-5"
              >
                <Github className="h-4 w-4" /> Posts on GitHub
              </a>
              <a
                href="mailto:contact@geodha.org?subject=Blog%20pitch"
                className="btn-poster inline-flex items-center gap-2 bg-secondary text-sm !py-2.5 !px-5"
              >
                Pitch by email
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
