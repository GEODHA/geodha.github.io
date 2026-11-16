import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Handshake } from 'lucide-react';
import { formatPostDate, getPost, relatedPosts } from '@/lib/blog';
import { SITE_URL } from '@/config/blog';
import Markdown from '@/components/blog/Markdown';
import TypeBadge from '@/components/blog/TypeBadge';
import ShareButtons from '@/components/blog/ShareButtons';
import Comments from '@/components/blog/Comments';
import PostCard from '@/components/blog/PostCard';

const BlogPost = () => {
  const { slug = '' } = useParams();
  const post = getPost(slug);

  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} — GEODHA Blog`;
    const meta = document.querySelector('meta[name="description"]');
    const prev = meta?.getAttribute('content');
    if (meta && post.summary) meta.setAttribute('content', post.summary);
    return () => {
      if (meta && prev) meta.setAttribute('content', prev);
    };
  }, [post]);

  if (!post) {
    return (
      <div className="container px-4 py-20 text-center space-y-4">
        <h1 className="text-3xl font-black">Post not found</h1>
        <p className="text-muted-foreground">It may have moved or been unpublished.</p>
        <Link to="/blog" className="inline-flex items-center gap-1 font-bold text-primary underline">
          <ArrowLeft className="h-4 w-4" /> Back to the blog
        </Link>
      </div>
    );
  }

  const url = `${SITE_URL}/blog/${post.slug}`;
  const related = relatedPosts(post);

  return (
    <article className="min-h-screen bg-background">
      <header className="border-b-[3px] border-ink bg-tint-yellow/40">
        <div className="container max-w-4xl px-4 py-8 sm:px-6 sm:py-12 space-y-5">
          <Link to="/blog" className="inline-flex items-center gap-1 text-sm font-bold text-foreground/70 hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> All posts
          </Link>
          <div className="flex flex-wrap items-center gap-2 font-mono text-sm text-muted-foreground">
            <TypeBadge type={post.type} />
            {post.issue && <span className="font-bold text-foreground">Issue #{post.issue}</span>}
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            <span aria-hidden>·</span>
            <span>{post.readingMinutes} min read</span>
            {post.draft && (
              <span className="rounded-md border-2 border-ink bg-tint-red px-2 py-0.5 font-sans text-xs font-bold text-ink">
                Draft — not published
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black leading-[1.08] tracking-[-0.02em] sm:text-5xl">{post.title}</h1>
          {post.summary && <p className="text-lg text-muted-foreground sm:text-xl">{post.summary}</p>}
          <p className="text-sm font-semibold">By {post.authors.join(', ')}</p>
        </div>
      </header>

      <div className="container max-w-4xl px-4 py-8 sm:px-6 sm:py-10 space-y-10">
        {post.cover && (
          <img
            src={post.cover}
            alt={post.coverAlt ?? ''}
            className="w-full rounded-2xl border-[3px] border-ink object-cover max-h-[520px]"
            style={{ boxShadow: 'var(--shadow-offset-4)' }}
          />
        )}

        {post.type === 'case-study' && (post.location || post.partner || post.highlights.length > 0) && (
          <aside className="rounded-2xl border-[3px] border-ink bg-tint-green/50 p-5 sm:p-6 space-y-5" style={{ boxShadow: 'var(--shadow-offset-4)' }}>
            {(post.location || post.partner) && (
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
                {post.location && (
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {post.location}</span>
                )}
                {post.partner && (
                  <span className="inline-flex items-center gap-1.5"><Handshake className="h-4 w-4" /> {post.partner}</span>
                )}
              </div>
            )}
            {post.highlights.length > 0 && (
              <dl className="grid gap-4 sm:grid-cols-3">
                {post.highlights.map((h, i) => (
                  <div key={i} className="rounded-xl border-2 border-ink bg-paper p-4">
                    <dt className="sr-only">{h.label}</dt>
                    <dd className="text-3xl font-black tracking-tight text-primary">{h.value}</dd>
                    <dd className="mt-1 text-sm text-muted-foreground">{h.label}</dd>
                  </div>
                ))}
              </dl>
            )}
          </aside>
        )}

        <div className="prose prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary prose-blockquote:border-l-primary prose-blockquote:font-normal prose-hr:border-ink/20">
          <Markdown>{post.body}</Markdown>
        </div>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <Link
                key={t}
                to={`/blog?tag=${encodeURIComponent(t)}`}
                className="rounded-full border-2 border-ink bg-tint-blue/60 px-3 py-1 text-sm font-semibold hover:bg-tint-blue"
              >
                #{t}
              </Link>
            ))}
          </div>
        )}

        <div className="border-y-2 border-ink/15 py-5">
          <ShareButtons url={url} title={post.title} />
        </div>

        <Comments slug={post.slug} />

        {related.length > 0 && (
          <section className="space-y-5 pt-4">
            <h2 className="text-2xl font-black">Keep reading</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
};

export default BlogPost;
