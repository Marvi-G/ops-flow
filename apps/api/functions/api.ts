import './setup-env.js';
import serverless from 'serverless-http';
import app from '../src/index.js';

const expressHandler = serverless(app);

type NetlifyEvent = { path: string } & Record<string, unknown>;

/**
 * Netlify Function entry point. All requests to /api/* are rewritten here
 * (see netlify.toml). Depending on how Netlify reports the path, it may be the
 * original URL (/api/auth/me) or the function URL (/.netlify/functions/api/auth/me),
 * so normalise both to /api/... which is what the Express routes expect.
 */
export const handler = (event: NetlifyEvent, context: unknown) => {
  const path = event.path.replace(/^\/\.netlify\/functions\/api/, '');
  event.path = path.startsWith('/api') ? path : `/api${path}`;
  return expressHandler(event as never, context as never);
};
