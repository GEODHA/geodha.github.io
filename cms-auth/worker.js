// GitHub OAuth proxy for Decap CMS — a Cloudflare Worker.
//
// GitHub Pages can't keep an OAuth client secret, so the CMS's "Login with
// GitHub" button opens a popup on this worker, which does the code-for-token
// exchange and hands the token back to the CMS window via postMessage.
//
// Setup (docs/BLOG.md has the step-by-step):
//   wrangler secret put GITHUB_CLIENT_ID
//   wrangler secret put GITHUB_CLIENT_SECRET
//   ALLOWED_ORIGINS is set in wrangler.toml
//
// Routes:
//   GET /auth?provider=github&scope=…  → redirects to GitHub's consent screen
//   GET /callback?code=…&state=…        → exchanges the code, returns the token to the CMS

const STATE_COOKIE = 'decap_oauth_state';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/auth') return startAuth(url, env);
    if (url.pathname === '/callback') return finishAuth(request, url, env);
    return new Response('GEODHA CMS auth: OK', { headers: { 'content-type': 'text/plain' } });
  },
};

function startAuth(url, env) {
  if (url.searchParams.get('provider') !== 'github') {
    return new Response('Only provider=github is supported', { status: 400 });
  }
  // Decap asks for "repo" or "public_repo" (backend.auth_scope); never grant more than that.
  const requested = url.searchParams.get('scope') || 'public_repo';
  const scope = ['repo', 'public_repo'].includes(requested) ? requested : 'public_repo';
  const state = crypto.randomUUID();

  const gh = new URL('https://github.com/login/oauth/authorize');
  gh.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  gh.searchParams.set('redirect_uri', `${url.origin}/callback`);
  gh.searchParams.set('scope', scope);
  gh.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      location: gh.toString(),
      'set-cookie': `${STATE_COOKIE}=${state}; Path=/callback; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
    },
  });
}

async function finishAuth(request, url, env) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = (request.headers.get('cookie') || '')
    .split(/;\s*/)
    .find((c) => c.startsWith(`${STATE_COOKIE}=`))
    ?.split('=')[1];

  if (!code || !state || state !== cookieState) {
    return reply(env, 'error', { message: 'Sign-in expired or was tampered with. Please try again.' });
  }

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', 'user-agent': 'geodha-cms-auth' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/callback`,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.access_token) {
    return reply(env, 'error', { message: data.error_description || 'GitHub did not return a token.' });
  }
  return reply(env, 'success', { token: data.access_token, provider: 'github' });
}

/**
 * The popup page. Decap's window listens for "authorizing:github", answers
 * with a message of its own, and we send the result only to that window's
 * origin — and only if it is one of ours.
 */
function reply(env, status, payload) {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  const html = `<!doctype html><meta charset="utf-8"><title>Signing in…</title>
<p style="font-family:system-ui;padding:2rem">${status === 'success' ? 'Signed in. You can close this window.' : 'Sign-in failed: ' + escapeHtml(payload.message)}</p>
<script>
(function () {
  var allowed = ${JSON.stringify(allowed)};
  var message = ${JSON.stringify(message)};
  function receive(e) {
    if (allowed.indexOf(e.origin) === -1) return;
    window.opener.postMessage(message, e.origin);
    window.removeEventListener('message', receive);
    setTimeout(function () { window.close(); }, 500);
  }
  window.addEventListener('message', receive);
  if (window.opener) window.opener.postMessage('authorizing:github', '*');
})();
</script>`;
  return new Response(html, {
    status: status === 'success' ? 200 : 400,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'set-cookie': `${STATE_COOKIE}=; Path=/callback; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
    },
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
