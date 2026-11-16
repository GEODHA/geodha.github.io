# GEODHA Blog

The blog at **www.geodha.org/blog** holds three kinds of posts:

| Type | Use it for | Folder |
|---|---|---|
| **Article** | Opinion pieces, explainers, guides, FAQs | `content/blog/articles/` |
| **Newsletter** | Regular updates on what's happening at GEODHA (has an issue number) | `content/blog/newsletters/` |
| **Case study** | Stories of change on the ground, with location, partner and up to six headline numbers | `content/blog/case-studies/` |

Each post is a Markdown file in the repo. The team writes and edits posts in **Decap CMS** at **www.geodha.org/cms/** and signs in with GitHub. Readers comment through **Giscus**, which stores comments in GitHub Discussions.

---

## For writers

1. Go to **https://www.geodha.org/cms/** and click **Login with GitHub**. You need write access to `GEODHA/geodha.github.io`, so ask an admin to add you.
2. Pick **Articles**, **Newsletters** or **Case studies**, then **New …**
3. Fill in the title, publish date and a 1–2 sentence **summary**. The summary appears on blog cards and in WhatsApp, LinkedIn and X link previews, so make it count.
4. Add a landscape **cover image** (about 1600×900) and describe it for screen readers.
5. Write the body. To embed a YouTube video, paste its link on a line by itself.
6. Click **Save**. This creates a **draft**, which is a pull request on GitHub.
7. Move it to **In review** on the **Workflow** tab and ask a teammate to read it. They can comment on the pull request or edit the draft in the CMS.
8. When it's ready, set it to **Ready** and click **Publish**. The site redeploys in about 2 minutes.

Other options:
- **Feature at the top of the blog** puts the post in the big card on `/blog`. The newest featured post wins.
- **Hide from the live site** takes a published post down without deleting it.
- **Tags** let readers filter (`/blog?tag=…`). Reuse existing tags where you can.

Images uploaded in the CMS are saved to `public/blog-media/`. Compress large images before uploading (for example with squoosh.app), since every image is stored in the repo.

## For developers

| Piece | Where |
|---|---|
| Post files | `content/blog/<type>/<slug>.md`. The file name is the URL slug. |
| CMS config (fields, collections) | `public/cms/config.yml` |
| Parsing (keep in sync with the CMS fields) | `src/lib/blogParse.ts` |
| Pages | `src/pages/Blog.tsx` (index, `?type=` and `?tag=` filters) and `src/pages/BlogPost.tsx` |
| Components | `src/components/blog/` |
| Comments config | `src/config/blog.ts` |
| Link-preview pages + RSS (build only) | `vite-plugins/blogStatic.ts` → `dist/blog/<slug>/index.html`, `dist/blog/rss.xml` |
| GitHub OAuth proxy | `cms-auth/` (Cloudflare Worker) |

**Editing locally, without signing in:**

```bash
npm run dev
```

```bash
npm run cms
```

Then open http://localhost:8080/cms/ and click **Login**. Changes are written straight to your local files, so commit them like any other change. Drafts (`draft: true`) show on the local site but are left out of the production build.

## One-time setup

### 1. GitHub login for the CMS

GitHub Pages can't keep an OAuth secret, so sign-in goes through a small Cloudflare Worker (free tier is plenty).

1. **Deploy the worker** from `cms-auth/`. Wrangler asks you to log in to Cloudflare the first time.

   ```bash
   cd cms-auth
   ```

   ```bash
   npx wrangler@4 deploy
   ```

   The deploy prints the worker's URL, for example `https://geodha-cms-auth.geodha.workers.dev`. The middle part (`geodha` here) is your Cloudflare account's **workers.dev subdomain**. You choose it once per account, the first time you use Workers. It also appears in the Cloudflare dashboard under *Workers & Pages* → *Account details*.

   *Optional:* if geodha.org's DNS is on Cloudflare, you can give the worker a custom domain instead (for example `cms-auth.geodha.org`, under the worker's *Settings → Domains & Routes*) and use that URL everywhere below.
2. **Create a GitHub OAuth app** under the GEODHA org: *Settings → Developer settings → OAuth Apps → New OAuth App*.
   - Homepage URL: `https://www.geodha.org`
   - Authorization callback URL: the worker URL from step 1 + `/callback`, for example `https://geodha-cms-auth.geodha.workers.dev/callback`

   Then generate a client secret.
3. **Give the worker the OAuth app's ID and secret**. Each command prompts you to paste the value:

   ```bash
   npx wrangler@4 secret put GITHUB_CLIENT_ID
   ```

   ```bash
   npx wrangler@4 secret put GITHUB_CLIENT_SECRET
   ```

4. Put the worker URL from step 1 (without `/callback`) in `backend.base_url` in `public/cms/config.yml`.
5. **Give writers access.** Every writer needs a GitHub account and **Write** access to `GEODHA/geodha.github.io`. An org owner or repo admin can grant it in one of two ways:
   - **One person at a time:** repo → *Settings → Collaborators and teams → Add people* → enter their GitHub username or email → choose role **Write**. They have to accept the email invitation.
   - **A team (easier as the group grows):** org page → *Teams → New team*, e.g. "Blog writers" → add members → open the team's *Repositories* tab → *Add repository* → `geodha.github.io` → permission **Write**. After that, adding someone to the team gives them access.

   Write access also lets people push code to the repo. To make sure every post gets a second pair of eyes, add a branch protection rule on `main` (*Settings → Branches*) that requires one approving review. The CMS **Publish** button then works only after a teammate approves the post's pull request on GitHub.

The CMS asks for the `public_repo` scope only. The worker sends the token only to the origins listed in `ALLOWED_ORIGINS` (`cms-auth/wrangler.toml`).

### Testing GitHub sign-in before going live

You don't need to merge into `main` first. Your laptop can use the real GitHub login against the `dev` branch:

1. Push `dev` so the posts exist on GitHub.
2. Temporarily add your local address to `ALLOWED_ORIGINS` in `cms-auth/wrangler.toml`, e.g. `"https://geodha.org,https://www.geodha.org,http://localhost:8080"`, then run `npx wrangler@4 deploy` again.
3. In `public/cms/config.yml`, temporarily set `branch: dev` and put the worker URL in `base_url`. Don't commit the `branch: dev` change.
4. Run `npm run dev` only, **without** `npm run cms`. When the local CMS server isn't running, Decap falls back to the GitHub login.
5. Open http://localhost:8080/cms/ → **Login with GitHub** → approve → save a test draft. A pull request against `dev` should appear on GitHub. Close it when you're done.

Afterwards, set `branch` back to `main`, remove `http://localhost:8080` from `ALLOWED_ORIGINS`, and redeploy the worker.

### 2. Comments (Giscus)

1. Repo *Settings → General → Features* → enable **Discussions**.
2. Install the giscus app on the repo: https://github.com/apps/giscus
3. In *Discussions*, create a category named **Blog comments** of type **Announcement**, so only giscus can open new threads.
4. On https://giscus.app enter `GEODHA/geodha.github.io`, choose that category, and copy `data-category-id` into `categoryId` in `src/config/blog.ts`. `repoId` is already filled in.

Until `categoryId` is set, posts show a "Comments are coming soon" note. Commenters sign in with GitHub. Moderate (hide, delete, lock) from the repo's Discussions tab.
