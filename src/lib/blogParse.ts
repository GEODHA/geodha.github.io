// Pure parsing helpers for blog posts (content/blog/**/*.md).
// Shared by the browser (src/lib/blog.ts) and the build-time plugin
// (vite-plugins/blogStatic.ts), so it must not touch Vite- or DOM-only APIs.

import { parse as parseYaml } from 'yaml';

export type PostType = 'article' | 'newsletter' | 'case-study';

/** Folder under content/blog/ → post type. Matches the Decap collections in public/cms/config.yml. */
export const TYPE_BY_FOLDER: Record<string, PostType> = {
  articles: 'article',
  newsletters: 'newsletter',
  'case-studies': 'case-study',
};

export const TYPE_LABELS: Record<PostType, string> = {
  article: 'Article',
  newsletter: 'Newsletter',
  'case-study': 'Case study',
};

export interface Highlight {
  value: string;
  label: string;
}

export interface Post {
  slug: string;
  type: PostType;
  title: string;
  date: string;          // ISO string
  summary: string;
  cover?: string;
  coverAlt?: string;
  authors: string[];
  tags: string[];
  featured: boolean;
  draft: boolean;
  /** Newsletter issue number. */
  issue?: number;
  /** Case study fields. */
  location?: string;
  partner?: string;
  highlights: Highlight[];
  body: string;
  readingMinutes: number;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

const str = (v: unknown): string | undefined =>
  v === null || v === undefined || v === '' ? undefined : String(v);

const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : typeof v === 'string' && v ? [v] : [];

/**
 * Parse one Markdown file into a Post. `path` is the file path; the folder
 * decides the type and the file name (minus .md) is the URL slug.
 */
export function parsePost(path: string, raw: string): Post | null {
  const parts = path.replace(/\\/g, '/').split('/');
  const file = parts[parts.length - 1];
  const folder = parts[parts.length - 2];
  const type = TYPE_BY_FOLDER[folder];
  if (!type || !file.endsWith('.md')) return null;

  const m = raw.match(FRONTMATTER);
  let data: Record<string, unknown> = {};
  let body = raw;
  if (m) {
    try {
      data = (parseYaml(m[1]) as Record<string, unknown>) ?? {};
    } catch (err) {
      console.warn(`[blog] Could not parse frontmatter in ${path}`, err);
    }
    body = m[2];
  }

  const slug = str(data.slug) ?? file.replace(/\.md$/, '');
  const dateRaw = data.date instanceof Date ? data.date.toISOString() : str(data.date);
  const words = body.split(/\s+/).filter(Boolean).length;

  const highlights = Array.isArray(data.highlights)
    ? (data.highlights as Record<string, unknown>[])
        .map((h) => ({ value: str(h?.value) ?? '', label: str(h?.label) ?? '' }))
        .filter((h) => h.value || h.label)
    : [];

  const issue = Number(data.issue);

  return {
    slug,
    type,
    title: str(data.title) ?? slug,
    date: dateRaw ?? new Date(0).toISOString(),
    summary: str(data.summary) ?? '',
    cover: str(data.cover),
    coverAlt: str(data.cover_alt),
    authors: strList(data.authors).length ? strList(data.authors) : ['GEODHA Team'],
    tags: strList(data.tags),
    featured: data.featured === true,
    draft: data.draft === true,
    issue: Number.isFinite(issue) && issue > 0 ? issue : undefined,
    location: str(data.location),
    partner: str(data.partner),
    highlights,
    body,
    readingMinutes: Math.max(1, Math.round(words / 220)),
  };
}

/** Newest first, drafts removed (unless `includeDrafts`). */
export function sortPosts(posts: (Post | null)[], includeDrafts = false): Post[] {
  return posts
    .filter((p): p is Post => !!p && (includeDrafts || !p.draft))
    .sort((a, b) => b.date.localeCompare(a.date));
}
