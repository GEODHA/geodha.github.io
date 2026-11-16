// Blog posts, loaded at build time from content/blog/**/*.md.
// Editors add and change these files through Decap CMS (/cms/), which commits
// them to the repo; see docs/BLOG.md.

import { parsePost, sortPosts, type Post, type PostType } from './blogParse';

export { TYPE_LABELS } from './blogParse';
export type { Post, PostType } from './blogParse';

const files = import.meta.glob('/content/blog/*/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Drafts show up while developing locally so editors can preview them.
const showDrafts = import.meta.env.DEV;

export const posts: Post[] = sortPosts(
  Object.entries(files).map(([path, raw]) => parsePost(path, raw)),
  showDrafts,
);

export const getPost = (slug: string): Post | undefined => posts.find((p) => p.slug === slug);

export const postsOfType = (type: PostType | 'all'): Post[] =>
  type === 'all' ? posts : posts.filter((p) => p.type === type);

export const formatPostDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/** Other posts to read next: same type or shared tags first. */
export function relatedPosts(post: Post, count = 3): Post[] {
  const score = (p: Post) =>
    (p.type === post.type ? 2 : 0) + p.tags.filter((t) => post.tags.includes(t)).length;
  return posts
    .filter((p) => p.slug !== post.slug && !p.draft)
    .map((p) => ({ p, s: score(p) }))
    .sort((a, b) => b.s - a.s || b.p.date.localeCompare(a.p.date))
    .slice(0, count)
    .map(({ p }) => p);
}
