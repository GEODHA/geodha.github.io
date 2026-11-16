import { useEffect, useRef } from 'react';
import { MessageSquare } from 'lucide-react';
import { GISCUS, giscusEnabled } from '@/config/blog';

/**
 * Giscus comment thread for one post. Each post maps to one GitHub Discussion,
 * keyed by its slug so the thread survives title edits and URL trailing slashes.
 */
const Comments = ({ slug }: { slug: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host || !giscusEnabled) return;
    host.innerHTML = '';
    const s = document.createElement('script');
    s.src = 'https://giscus.app/client.js';
    s.async = true;
    s.crossOrigin = 'anonymous';
    const attrs: Record<string, string> = {
      'data-repo': GISCUS.repo,
      'data-repo-id': GISCUS.repoId,
      'data-category': GISCUS.category,
      'data-category-id': GISCUS.categoryId,
      'data-mapping': 'specific',
      'data-term': `blog/${slug}`,
      'data-strict': '1',
      'data-reactions-enabled': '1',
      'data-emit-metadata': '0',
      'data-input-position': 'top',
      'data-theme': 'light',
      'data-lang': 'en',
      'data-loading': 'lazy',
    };
    for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
    host.appendChild(s);
    return () => {
      host.innerHTML = '';
    };
  }, [slug]);

  return (
    <section aria-labelledby="comments-heading" className="space-y-4">
      <h2 id="comments-heading" className="flex items-center gap-2 text-2xl font-black">
        <MessageSquare className="h-6 w-6" /> Comments
      </h2>
      {giscusEnabled ? (
        <>
          <p className="text-sm text-muted-foreground">
            Sign in with GitHub to join the discussion. Be kind — comments are moderated.
          </p>
          <div ref={ref} />
        </>
      ) : (
        <p className="rounded-xl border-2 border-dashed border-ink/40 p-4 text-sm text-muted-foreground">
          Comments are coming soon. Meanwhile, write to us at{' '}
          <a className="font-semibold text-primary underline" href="mailto:contact@geodha.org">
            contact@geodha.org
          </a>
          .
        </p>
      )}
    </section>
  );
};

export default Comments;
