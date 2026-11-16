// Blog settings that aren't post content.

/**
 * Giscus comments (https://giscus.app) — stored as GitHub Discussions on the
 * site repo, so readers sign in with GitHub to comment and the team moderates
 * from the repo's Discussions tab.
 *
 * To turn comments on: enable Discussions on the repo, install the giscus app
 * on it, create a "Blog comments" category (Announcement type, so only
 * giscus can start threads), then copy its categoryId from https://giscus.app.
 * While either ID is empty, posts show a "comments coming soon" note instead.
 */
export const GISCUS = {
  repo: 'GEODHA/geodha.github.io',
  repoId: 'R_kgDOJ3MtMw',
  category: 'Blog comments',
  categoryId: '',
} as const;

export const giscusEnabled = Boolean(GISCUS.repoId && GISCUS.categoryId);

export const SITE_URL = 'https://www.geodha.org';
