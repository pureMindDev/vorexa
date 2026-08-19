// CLIENT_URL used to be treated as a single exact-match origin. That's fragile the moment
// there's more than one real frontend origin (e.g. a Vercel production domain plus its preview
// deployments, or www vs non-www, or a trailing slash typo) — cors/socket.io would silently
// reject every request from anywhere that doesn't match byte-for-byte. The browser shows this
// as a CORS error in devtools; the app just shows "not connecting" with no clear reason.
//
// Supports a comma-separated list in CLIENT_URL, trims whitespace and trailing slashes, and
// allows requests with no Origin header (server-to-server calls, curl, some mobile webviews).
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const corsOriginCheck = (origin, callback) => {
  if (!origin) return callback(null, true);
  const normalized = origin.replace(/\/+$/, '');
  if (allowedOrigins.length === 0 || allowedOrigins.includes(normalized)) {
    return callback(null, true);
  }
  return callback(new Error(`Origin ${origin} not allowed by CORS`));
};

module.exports = { allowedOrigins, corsOriginCheck };
