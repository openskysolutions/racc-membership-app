/**
 * News Routes for RACC Membership Portal
 * Public news and announcements for chamber members and community
 */

import express, { Request, Response } from 'express';
import { requireAuth, requireAdmin } from '@/middleware/auth';

// Type extensions are automatically available through tsconfig.json

const router = express.Router();

// Mock news data - in production this would connect to a database
const mockNews = [
  {
    id: 'news_001',
    title: 'RACC September Networking Luncheon',
    slug: 'racc-september-networking-luncheon',
    excerpt: 'Join us for our monthly networking luncheon featuring guest speaker Sarah Johnson.',
    content: 'We are excited to announce our September networking luncheon will be held on September 25th at the Richfield Community Center. Our guest speaker will be Sarah Johnson from Johnson Real Estate Group, who will present on "Commercial Real Estate Trends in Central Utah."',
    imageUrl: '/news-placeholder.jpg',
    category: 'events',
    author: 'RACC Staff',
    publishedDate: '2024-09-01',
    status: 'published',
    tags: ['networking', 'luncheon', 'real estate']
  },
  {
    id: 'news_002',
    title: 'New Member Spotlight: Davis Construction LLC',
    slug: 'new-member-spotlight-davis-construction',
    excerpt: 'Welcome Davis Construction LLC to the RACC family! Learn about their services and expertise.',
    content: 'We are proud to welcome Davis Construction LLC as our newest member. Founded by Michael Davis, the company specializes in residential and commercial construction throughout Central Utah. With over 15 years of experience, they bring quality craftsmanship and reliable service to our community.',
    imageUrl: '/member-spotlight-placeholder.jpg',
    category: 'member-spotlight',
    author: 'RACC Staff',
    publishedDate: '2024-08-28',
    status: 'published',
    tags: ['new member', 'construction', 'spotlight']
  },
  {
    id: 'news_003',
    title: 'Chamber Business Awards Nominations Open',
    slug: 'chamber-business-awards-nominations-open',
    excerpt: 'Nominate outstanding local businesses for our annual Chamber Business Awards.',
    content: 'Nominations are now open for the 2024 Chamber Business Awards! Categories include Business of the Year, Emerging Business, Community Service Award, and Innovation Award. Nominations close on October 15th. The awards ceremony will be held on November 20th at the Richfield Civic Center.',
    imageUrl: '/awards-placeholder.jpg',
    category: 'announcements',
    author: 'RACC Staff',
    publishedDate: '2024-08-25',
    status: 'published',
    tags: ['awards', 'nominations', 'business excellence']
  }
];

/**
 * GET /news
 * List news articles (PUBLIC - no authentication required)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, tag, limit, offset } = req.query;
    
    let filteredNews = mockNews.filter(article => article.status === 'published');
    
    // Filter by category
    if (category) {
      filteredNews = filteredNews.filter(article => 
        article.category === (category as string)
      );
    }
    
    // Filter by tag
    if (tag) {
      filteredNews = filteredNews.filter(article => 
        article.tags.includes(tag as string)
      );
    }
    
    // Sort by published date (newest first)
    filteredNews.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
    
    // Apply pagination
    const parsedLimit = limit ? parseInt(limit as string, 10) : 10;
    const parsedOffset = offset ? parseInt(offset as string, 10) : 0;
    const paginatedNews = filteredNews.slice(parsedOffset, parsedOffset + parsedLimit);
    
    res.json({
      news: paginatedNews,
      total: filteredNews.length,
      limit: parsedLimit,
      offset: parsedOffset
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /news/:slug
 * Get specific news article by slug (PUBLIC - no authentication required)
 */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const article = mockNews.find(n => n.slug === slug && n.status === 'published');
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    res.json(article);
  } catch (error) {
    console.error('Error fetching news article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /news
 * Create new news article (admin only)
 */
router.post('/', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, excerpt, content, category, imageUrl, tags } = req.body;
    
    if (!title || !excerpt || !content) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'title, excerpt, and content are required'
      });
    }
    
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
    
    const newArticle = {
      id: `news_${Date.now()}`,
      title,
      slug: `${slug}-${Date.now()}`,
      excerpt,
      content,
      imageUrl: imageUrl || '/news-placeholder.jpg',
      category: category || 'announcements',
      author: req.user?.id || 'RACC Staff',
      publishedDate: new Date().toISOString().split('T')[0],
      status: 'published',
      tags: tags || []
    };
    
    mockNews.push(newArticle);
    
    res.status(201).json(newArticle);
  } catch (error) {
    console.error('Error creating news article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
