// Build-time companion to the blog (src/pages/Blog*.tsx).
//
// The site is a single-page app, so link-preview bots (WhatsApp, LinkedIn, X,
// Facebook) and search engines only ever see index.html's generic tags. After
// `vite build` this plugin writes:
//   dist/blog/index.html          — the SPA shell with blog-wide meta tags
//   dist/blog/<slug>/index.html   — the SPA shell with that post's title,
//                                   summary, cover image and canonical URL
//   dist/blog/rss.xml             — an RSS feed of published posts
// GitHub Pages serves these directly, then the app boots and renders the post.

import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { parsePost, sortPosts, TYPE_LABELS, type Post } from '../src/lib/blogParse';

const SITE = 'https://www.geodha.org';
const BLOG_TITLE = 'GEODHA Blog';
const BLOG_DESC =
  "Articles, newsletters and case studies on civic action, waste and cleaner cities — what we're learning and what's changing.";

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const abs = (u: string) => (/^https?:\/\//.test(u) ? u : SITE + (u.startsWith('/') ? u : `/${u}`));

function readPosts(root: string): Post[] {
  const dir = path.join(root, 'content/blog');
  if (!fs.existsSync(dir)) return [];
  const all: (Post | null)[] = [];
  for (const folder of fs.readdirSync(dir)) {
    const sub = path.join(dir, folder);
    if (!fs.statSync(sub).isDirectory()) continue;
    for (const file of fs.readdirSync(sub)) {
      if (file.endsWith('.md')) all.push(parsePost(`${folder}/${file}`, fs.readFileSync(path.join(sub, file), 'utf8')));
    }
  }
  return sortPosts(all);
}

interface Meta {
  title: string;
  description: string;
  url: string;
  image?: string;
  imageAlt?: string;
  type: 'website' | 'article';
  extra?: string;
}

/** Swap the generic tags in index.html for page-specific ones. */
function withMeta(shell: string, m: Meta): string {
  const setMeta = (html: string, attr: 'name' | 'property', key: string, value: string) => {
    const re = new RegExp(`<meta\\s+${attr}="${key.replace(/:/g, '\\:')}"\\s+content="[^"]*"\\s*/?>`);
    const tag = `<meta ${attr}="${key}" content="${esc(value)}" />`;
    return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
  };
  let html = shell.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(m.title)}</title>`);
  html = setMeta(html, 'name', 'description', m.description);
  html = setMeta(html, 'property', 'og:title', m.title);
  html = setMeta(html, 'property', 'og:description', m.description);
  html = setMeta(html, 'property', 'og:type', m.type);
  html = setMeta(html, 'property', 'og:url', m.url);
  html = setMeta(html, 'name', 'twitter:title', m.title);
  html = setMeta(html, 'name', 'twitter:description', m.description);
  if (m.image) {
    html = setMeta(html, 'property', 'og:image', m.image);
    html = setMeta(html, 'name', 'twitter:image', m.image);
    // The default 1200×630 dimensions don't apply to a post's own cover.
    html = html.replace(/\s*<meta property="og:image:(width|height)" content="[^"]*" \/>/g, '');
    if (m.imageAlt) {
      html = setMeta(html, 'property', 'og:image:alt', m.imageAlt);
      html = setMeta(html, 'name', 'twitter:image:alt', m.imageAlt);
    }
  }
  const head = [
    `<link rel="canonical" href="${esc(m.url)}" />`,
    `<link rel="alternate" type="application/rss+xml" title="${BLOG_TITLE}" href="${SITE}/blog/rss.xml" />`,
    m.extra ?? '',
  ].filter(Boolean);
  return html.replace('</head>', `    ${head.join('\n    ')}\n  </head>`);
}

function rss(posts: Post[]): string {
  const items = posts
    .slice(0, 50)
    .map((p) => {
      const url = `${SITE}/blog/${p.slug}`;
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <category>${esc(TYPE_LABELS[p.type])}</category>
${p.tags.map((t) => `      <category>${esc(t)}</category>`).join('\n')}
      <description>${esc(p.summary)}</description>
    </item>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${BLOG_TITLE}</title>
    <link>${SITE}/blog</link>
    <atom:link href="${SITE}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <description>${esc(BLOG_DESC)}</description>
    <language>en-in</language>
${posts[0] ? `    <lastBuildDate>${new Date(posts[0].date).toUTCString()}</lastBuildDate>\n` : ''}${items}
  </channel>
</rss>
`;
}

export default function blogStatic(): Plugin {
  let root = process.cwd();
  let outDir = 'dist';
  return {
    name: 'geodha-blog-static',
    apply: 'build',
    configResolved(cfg) {
      root = cfg.root;
      outDir = path.resolve(cfg.root, cfg.build.outDir);
    },
    closeBundle() {
      const shellPath = path.join(outDir, 'index.html');
      if (!fs.existsSync(shellPath)) return;
      const shell = fs.readFileSync(shellPath, 'utf8');
      const posts = readPosts(root);
      const blogDir = path.join(outDir, 'blog');
      fs.mkdirSync(blogDir, { recursive: true });

      fs.writeFileSync(
        path.join(blogDir, 'index.html'),
        withMeta(shell, { title: `${BLOG_TITLE} — Stories from the ground`, description: BLOG_DESC, url: `${SITE}/blog`, type: 'website' }),
      );

      for (const p of posts) {
        const dir = path.join(blogDir, p.slug);
        fs.mkdirSync(dir, { recursive: true });
        const url = `${SITE}/blog/${p.slug}`;
        const ld = {
          '@context': 'https://schema.org',
          '@type': p.type === 'newsletter' ? 'NewsArticle' : 'BlogPosting',
          headline: p.title,
          description: p.summary,
          datePublished: p.date,
          author: p.authors.map((name) => ({ '@type': name === 'GEODHA Team' ? 'Organization' : 'Person', name })),
          publisher: { '@type': 'Organization', name: 'GEODHA', url: SITE },
          mainEntityOfPage: url,
          ...(p.cover ? { image: abs(p.cover) } : {}),
        };
        fs.writeFileSync(
          path.join(dir, 'index.html'),
          withMeta(shell, {
            title: `${p.title} — GEODHA Blog`,
            description: p.summary || BLOG_DESC,
            url,
            image: p.cover ? abs(p.cover) : undefined,
            imageAlt: p.coverAlt,
            type: 'article',
            extra: [
              `<meta property="article:published_time" content="${esc(p.date)}" />`,
              ...p.tags.map((t) => `<meta property="article:tag" content="${esc(t)}" />`),
              `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`,
            ].join('\n    '),
          }),
        );
      }

      fs.writeFileSync(path.join(blogDir, 'rss.xml'), rss(posts));
      console.log(`[blog] wrote ${posts.length} post pages + rss.xml`);
    },
  };
}

/**
 * Vite's dev/preview servers answer /cms/ with the app's index.html (SPA
 * fallback). GitHub Pages serves public/cms/index.html there, so mirror that
 * locally for `npm run dev` + `npm run cms` editing.
 */
export function cmsIndex(): Plugin {
  const rewrite = (req: { url?: string }, _res: unknown, next: () => void) => {
    if (req.url === '/cms' || req.url === '/cms/' || req.url?.startsWith('/cms/?') || req.url?.startsWith('/cms?')) {
      req.url = '/cms/index.html';
    }
    next();
  };
  return {
    name: 'geodha-cms-index',
    configureServer(server) {
      server.middlewares.use(rewrite);
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewrite);
    },
  };
}
