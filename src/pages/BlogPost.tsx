import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Share2, Check, PenLine } from 'lucide-react';
import { getPost, POSTS, renderMarkdown, formatPostDate } from '@/lib/blog';
import { GITHUB_REPO_URL } from '@/config/community';
import { trackEvent } from '@/lib/analytics';
import NotFound from './NotFound';

const BlogPost = () => {
  const { slug = '' } = useParams();
  const post = getPost(slug);
  const html = useMemo(() => (post ? renderMarkdown(post.body) : ''), [post]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (post) document.title = `${post.title} — GEODHA Blog`;
  }, [post]);

  if (!post) return <NotFound />;

  const idx  = POSTS.findIndex((p) => p.slug === post.slug);
  const next = POSTS[idx + 1];   // older post
  const prev = POSTS[idx - 1];   // newer post

  const share = async () => {
    trackEvent('share_click', { target: 'blog', slug: post.slug });
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: post.title, url }); return; }
      catch (err) { if ((err as Error).name === 'AbortError') return; }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* ignore */ }
  };

  return (
    <article className="min-h-screen bg-background">
      <header className="bg-paper border-b-[3px] border-ink py-10 sm:py-14">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground/70 hover:text-primary mb-5">
            <ArrowLeft className="h-4 w-4" /> All posts
          </Link>
          <p className="mono-label mb-3">
            {formatPostDate(post.date)} · {post.readMins} min read
          </p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-[-0.03em] leading-[1.08] mb-4">{post.title}</h1>
          {post.summary && <p className="text-lg text-foreground/70 font-medium leading-relaxed">{post.summary}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold">By {post.author}</span>
            {post.tags.map((t) => (
              <span key={t} className="text-[11px] font-bold rounded-full px-2.5 py-0.5 border-2 border-ink/20">#{t}</span>
            ))}
            <button
              onClick={share}
              className="ml-auto inline-flex items-center gap-1.5 text-sm font-bold rounded-full px-3.5 py-1.5 border-2 border-ink hover:bg-tint-yellow transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Share2 className="h-4 w-4" />}
              {copied ? 'Link copied' : 'Share'}
            </button>
          </div>
        </div>
      </header>

      {post.cover && (
        <div className="container px-4 sm:px-6 lg:px-8 max-w-3xl -mb-2 pt-8">
          <img src={post.cover} alt="" className="w-full rounded-2xl border-[3px] border-ink object-cover max-h-[420px]" />
        </div>
      )}

      <div className="container px-4 sm:px-6 lg:px-8 max-w-3xl py-10">
        <div className="blog-prose" dangerouslySetInnerHTML={{ __html: html }} />

        <div className="divider-poster my-10" />

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          {prev ? (
            <Link to={`/blog/${prev.slug}`} className="flex-1 border-[2.5px] border-ink rounded-xl p-4 hover:bg-tint-yellow transition-colors">
              <p className="mono-label !text-[11px] mb-1">← Newer</p>
              <p className="font-extrabold leading-snug">{prev.title}</p>
            </Link>
          ) : <span className="flex-1" />}
          {next ? (
            <Link to={`/blog/${next.slug}`} className="flex-1 border-[2.5px] border-ink rounded-xl p-4 hover:bg-tint-yellow transition-colors text-right">
              <p className="mono-label !text-[11px] mb-1">Older →</p>
              <p className="font-extrabold leading-snug">{next.title}</p>
            </Link>
          ) : <span className="flex-1" />}
        </div>

        <p className="mt-8 text-sm text-muted-foreground flex items-center gap-2">
          <PenLine className="h-4 w-4" />
          Spotted an error?{' '}
          <a
            className="underline font-semibold hover:text-primary"
            href={`${GITHUB_REPO_URL}/tree/main/content/blog`}
            target="_blank" rel="noopener noreferrer"
          >
            Suggest an edit on GitHub
          </a>
        </p>
      </div>
    </article>
  );
};

export default BlogPost;
