import express from 'express';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.FRONTEND_PORT || 3001;
const API_BASE = `http://localhost:${process.env.PORT || 3000}/api`;
const SITE_URL = 'https://members.richfieldareachamber.com';
const DEFAULT_IMAGE = `${SITE_URL}/images/og-image.png`;

// Only proxy images from trusted GoHighLevel / Google Cloud Storage domains
const ALLOWED_IMAGE_HOSTS = ['assets.cdn.filesafe.space', 'storage.googleapis.com', 'msgsndr.com'];

// Image proxy – pipes CDN images through our domain so Facebook can fetch them.
// Only allows trusted GoHighLevel / Google Cloud Storage hosts.
app.get('/og-image-proxy', (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).end();
  try {
    const parsed = new URL(imageUrl);
    if (!ALLOWED_IMAGE_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))) {
      return res.status(403).end();
    }
    const client = parsed.protocol === 'https:' ? https : http;
    client.get(imageUrl, (upstream) => {
      res.setHeader('Content-Type', upstream.headers['content-type'] || 'image/jpeg');
      if (upstream.headers['content-length']) {
        res.setHeader('Content-Length', upstream.headers['content-length']);
      }
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.status(upstream.statusCode || 200);
      upstream.pipe(res);
    }).on('error', () => res.status(500).end());
  } catch {
    return res.status(500).end();
  }
});

// Detect social media / link-preview crawlers
function isSocialCrawler(ua = '') {
  return /facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|WhatsApp|Discordbot|TelegramBot|pinterest|Googlebot/i.test(ua);
}

// Build an OG-only HTML shell so scrapers get meaningful meta tags
function buildOgHtml({ title, description, image, url }) {
  const esc = (s = '') => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${esc(url)}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${esc(image)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${esc(image)}" />
</head>
<body></body>
</html>`;
}

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// OG tag injection for blog post pages when requested by social crawlers
app.get('/blog/:slug', async (req, res, next) => {
  const ua = req.headers['user-agent'] || '';
  if (!isSocialCrawler(ua)) return next();

  try {
    const apiUrl = `${API_BASE}/posts/slug/${encodeURIComponent(req.params.slug)}`;
    const apiRes = await fetch(apiUrl);
    if (!apiRes.ok) return next();

    const body = await apiRes.json();
    const post = body.data || body;
    if (!post || !post.title) return next();
    const description = post.metadata || 'Read this post on the Richfield Area Chamber of Commerce member portal.';
    const image = post.mainImage
      ? `${SITE_URL}/og-image-proxy?url=${encodeURIComponent(post.mainImage)}`
      : DEFAULT_IMAGE;
    const html = buildOgHtml({
      title: post.title || 'Richfield Area Chamber of Commerce',
      description,
      image,
      url: `${SITE_URL}/blog/${req.params.slug}`,
    });
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (err) {
    console.error('OG scraper handler error:', err);
    return next();
  }
});

// Handle client-side routing by serving index.html for all non-API routes
app.get('*', (req, res) => {
  console.log(`Serving index.html for route: ${req.path}`);
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Frontend server running on port ${port}`);
  console.log(`Serving files from: ${path.join(__dirname, 'dist')}`);
});