import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.FRONTEND_PORT || 3001;
const API_BASE = `http://localhost:${process.env.PORT || 3000}/api`;
const SITE_URL = 'https://richfieldareachamber.com';
const DEFAULT_IMAGE = `${SITE_URL}/images/og-image.png`;

// Public, non-authenticated pages worth indexing. Everything requiring login
// (admin, voting, profile, etc.) is intentionally left out.
const SITEMAP_STATIC_PAGES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/join', changefreq: 'monthly', priority: '0.9' },
  { path: '/basic-membership', changefreq: 'monthly', priority: '0.7' },
  { path: '/enhanced-membership', changefreq: 'monthly', priority: '0.7' },
  { path: '/elite-membership', changefreq: 'monthly', priority: '0.7' },
  { path: '/board', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
  { path: '/calendar', changefreq: 'daily', priority: '0.8' },
  { path: '/blog', changefreq: 'daily', priority: '0.8' },
  { path: '/jobs', changefreq: 'daily', priority: '0.8' },
  { path: '/event-pages', changefreq: 'daily', priority: '0.7' },
  { path: '/nominations', changefreq: 'monthly', priority: '0.5' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
];

let sitemapCache = { xml: '', timestamp: 0 };
const SITEMAP_CACHE_TTL_MS = 60 * 60 * 1000;

function xmlEscape(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function sitemapUrl(loc, { lastmod, changefreq, priority } = {}) {
  const lines = [`  <url>`, `    <loc>${xmlEscape(loc)}</loc>`];
  if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) lines.push(`    <priority>${priority}</priority>`);
  lines.push('  </url>');
  return lines.join('\n');
}

// Combines the static route list with live blog posts and job postings so
// new content shows up without a code deploy. (WordPress event-pages are
// skipped: richfieldareachamber.com/wp-json currently isn't reachable in
// production - it falls through to the SPA's index.html instead of JSON.)
async function buildSitemapXml() {
  const urls = SITEMAP_STATIC_PAGES.map((p) => sitemapUrl(`${SITE_URL}${p.path}`, p));

  try {
    const r = await fetch(`${API_BASE}/posts?limit=500`);
    if (r.ok) {
      const body = await r.json();
      for (const post of body.data || []) {
        if (!post.slug || post.published === false) continue;
        urls.push(sitemapUrl(`${SITE_URL}/blog/${post.slug}`, {
          lastmod: (post.updatedAt || post.createdAt || '').slice(0, 10) || undefined,
          changefreq: 'monthly',
          priority: '0.6',
        }));
      }
    }
  } catch (err) {
    console.error('Sitemap: failed to fetch blog posts', err);
  }

  try {
    const r = await fetch(`${API_BASE}/jobs?status=active&limit=200`);
    if (r.ok) {
      const body = await r.json();
      for (const job of body.jobs || []) {
        if (!job.id) continue;
        urls.push(sitemapUrl(`${SITE_URL}/jobs/${job.id}`, {
          lastmod: (job.updatedAt || job.createdAt || '').slice(0, 10) || undefined,
          changefreq: 'weekly',
          priority: '0.6',
        }));
      }
    }
  } catch (err) {
    console.error('Sitemap: failed to fetch job postings', err);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

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

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use(express.static(path.join(__dirname, 'dist')));

// Served without a file extension, so static middleware can't infer the mime type
app.get('/.well-known/apple-app-site-association', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.sendFile(path.join(__dirname, 'dist', '.well-known', 'apple-app-site-association'));
});

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
      ? `${SITE_URL}/blog-image/${req.params.slug}.jpg`
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

app.get('/sitemap.xml', async (req, res) => {
  try {
    const now = Date.now();
    if (!sitemapCache.xml || now - sitemapCache.timestamp > SITEMAP_CACHE_TTL_MS) {
      sitemapCache = { xml: await buildSitemapXml(), timestamp: now };
    }
    res.setHeader('Content-Type', 'application/xml');
    res.send(sitemapCache.xml);
  } catch (err) {
    console.error('Sitemap generation error:', err);
    res.status(500).send('Error generating sitemap');
  }
});

app.get('*', (req, res) => {
  console.log(`Serving index.html for route: ${req.path}`);
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Frontend server running on port ${port}`);
  console.log(`Serving files from: ${path.join(__dirname, 'dist')}`);
});
