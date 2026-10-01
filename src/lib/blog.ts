// Blog content loader.
//
// Posts are Markdown files in /content/blog, managed through Decap CMS at
// /cms (GitHub login) or by opening a pull request. Each file starts with a
// YAML front-matter block:
//
//   ---
//   title: "Why open dumps keep coming back"
//   date: 2026-09-14
//   author: "GEODHA volunteers"
//   summary: "One-paragraph teaser shown on the blog index."
//   cover: /media/blog/cover.jpg
//   tags: [waste, data]
//   draft: false
//   ---
//
// Files are bundled at build time (import.meta.glob), so the blog needs no
// server, API key or third-party embed.

import { marked } from 'marked';

export interface BlogPost {
  slug:      string;
  title:     string;
  date:      string;   // ISO yyyy-mm-dd
  author:    string;
  summary:   string;
  cover?:    string;
  tags:      string[];
  body:      string;   // raw markdown
  readMins:  number;
}

const RAW_POSTS = import.meta.glob('/content/blog/*.md', {
  query: '?raw', import: 'default', eager: true,
}) as Record<string, string>;

// ── Minimal front-matter parser ───────────────────────────────────────────────
// Handles the flat shapes Decap writes: `key: value`, quoted strings,
// inline lists `[a, b]` and block lists (`key:` followed by `- item` lines).

type FMValue = string | string[] | boolean;

function unquote(v: string): string {
  const t = v.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1).replace(/\\"/g, '"');
  }
  return t;
}

function parseFrontMatter(raw: string): { data: Record<string, FMValue>; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data: Record<string, FMValue> = {};
  const lines = m[1].split(/\r?\n/);
  let listKey: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && listKey) {
      (data[listKey] as string[]).push(unquote(item[1]));
      continue;
    }
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, value] = kv;
    listKey = null;
    if (/^[>|][-+]?$/.test(value)) {
      // Block scalar (Decap writes long text as `key: >-` + indented lines).
      const block: string[] = [];
      while (i + 1 < lines.length && (/^\s+\S/.test(lines[i + 1]) || lines[i + 1].trim() === '')) {
        block.push(lines[++i].trim());
      }
      data[key] = value.startsWith('>')
        ? block.join(' ').replace(/\s+/g, ' ').trim()
        : block.join('\n').trim();
      continue;
    }
    if (value === '' || value === '[]') { data[key] = []; listKey = value === '' ? key : null; continue; }
    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value.slice(1, -1).split(',').map(unquote).filter(Boolean);
    } else if (value === 'true' || value === 'false') {
      data[key] = value === 'true';
    } else {
      data[key] = unquote(value);
    }
  }
  return { data, body: m[2] };
}

const str = (v: FMValue | undefined) => (typeof v === 'string' ? v : '');

function toPost(path: string, raw: string): BlogPost | null {
  const { data, body } = parseFrontMatter(raw);
  if (data.draft === true) return null;
  const file  = path.split('/').pop()!.replace(/\.md$/, '');
  const slug  = str(data.slug) || file;
  const date  = str(data.date).slice(0, 10) || file.slice(0, 10);
  const words = body.split(/\s+/).filter(Boolean).length;
  return {
    slug,
    title:   str(data.title) || slug,
    date,
    author:  str(data.author) || 'GEODHA volunteers',
    summary: str(data.summary),
    cover:   str(data.cover) || undefined,
    tags:    Array.isArray(data.tags) ? data.tags : [],
    body,
    readMins: Math.max(1, Math.round(words / 220)),
  };
}

export const POSTS: BlogPost[] = Object.entries(RAW_POSTS)
  .map(([path, raw]) => toPost(path, raw))
  .filter((p): p is BlogPost => p !== null)
  .sort((a, b) => b.date.localeCompare(a.date));

export const ALL_TAGS: string[] = [...new Set(POSTS.flatMap((p) => p.tags))].sort();

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

/** Post bodies come from repo collaborators only (via PR or the CMS). */
export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false, gfm: true }) as string;
}

export function formatPostDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}
