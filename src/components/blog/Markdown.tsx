import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'react-router-dom';

/** youtu.be/ID, youtube.com/watch?v=ID, youtube.com/shorts/ID → ID */
function youTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null;
    if (u.hostname.endsWith('youtube.com')) {
      if (u.pathname.startsWith('/shorts/') || u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] || null;
      return u.searchParams.get('v');
    }
  } catch {
    /* not a URL */
  }
  return null;
}

const components: Components = {
  // A paragraph that is nothing but a YouTube link becomes an embedded player.
  p({ node, children, ...rest }) {
    const only = node?.children.length === 1 ? node.children[0] : null;
    if (only && only.type === 'element' && only.tagName === 'a') {
      const href = String(only.properties?.href ?? '');
      const id = youTubeId(href);
      if (id) {
        return (
          <div className="not-prose my-8 aspect-video overflow-hidden rounded-2xl border-[3px] border-ink">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${id}`}
              title="YouTube video"
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        );
      }
    }
    return <p {...rest}>{children}</p>;
  },
  a({ node: _node, href = '', children, ...rest }) {
    if (href.startsWith('/') && !href.startsWith('//')) {
      return <Link to={href}>{children}</Link>;
    }
    const external = /^https?:\/\//.test(href);
    return (
      <a href={href} {...rest} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    );
  },
  img({ node: _node, alt, ...rest }) {
    return <img alt={alt ?? ''} loading="lazy" className="rounded-xl border-2 border-ink" {...rest} />;
  },
  table({ node: _node, children, ...rest }) {
    return (
      <div className="overflow-x-auto">
        <table {...rest}>{children}</table>
      </div>
    );
  },
};

const Markdown = ({ children }: { children: string }) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
    {children}
  </ReactMarkdown>
);

export default Markdown;
