import axios from 'axios';

// WordPress REST API base URL - update this to your WordPress site
const WP_API_BASE = import.meta.env.VITE_WORDPRESS_API_URL || 'https://your-wordpress-site.com/wp-json/wp/v2';

export type WordPressPostType = 'posts' | 'pages' | string; // Can be any custom post type

export interface WordPressPost {
  id: number;
  date: string;
  modified: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  rendered_content?: string; // Fully processed content with shortcodes
  author: number;
  featured_media: number;
  comment_status: string;
  ping_status: string;
  sticky: boolean;
  template: string;
  format: string;
  categories: number[];
  tags: number[];
  _embedded?: {
    author?: Array<{
      id: number;
      name: string;
      url: string;
      description: string;
      avatar_urls: {
        [key: string]: string;
      };
    }>;
    'wp:featuredmedia'?: Array<{
      id: number;
      source_url: string;
      alt_text: string;
      media_details: {
        width: number;
        height: number;
        sizes: {
          [key: string]: {
            source_url: string;
            width: number;
            height: number;
          };
        };
      };
    }>;
    'wp:term'?: Array<Array<{
      id: number;
      name: string;
      slug: string;
    }>>;
  };
}

export interface WordPressCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
  parent: number;
}

export interface WordPressAuthor {
  id: number;
  name: string;
  url: string;
  description: string;
  link: string;
  slug: string;
  avatar_urls: {
    [key: string]: string;
  };
}

/**
 * Generic function to fetch WordPress content by post type
 * @param postType The type of content to fetch ('posts', 'pages', or custom post type slug)
 * @param params Query parameters for filtering
 */
export async function getWordPressContent(
  postType: WordPressPostType = 'posts',
  params?: {
    per_page?: number;
    page?: number;
    search?: string;
    categories?: number[];
    tags?: number[];
    author?: number;
    orderby?: 'date' | 'relevance' | 'id' | 'title' | 'menu_order';
    order?: 'asc' | 'desc';
    parent?: number; // For hierarchical post types like pages
    status?: string; // Default is 'publish'
    meta_key?: string; // For filtering by custom field
    meta_value?: string; // Value of the custom field
  }
) {
  try {
    const response = await axios.get<WordPressPost[]>(`${WP_API_BASE}/${postType}`, {
      params: {
        status: params?.status || 'publish',
        _embed: true, // Include embedded data like featured images and authors
        per_page: params?.per_page || 10,
        page: params?.page || 1,
        search: params?.search,
        categories: params?.categories?.join(','),
        tags: params?.tags?.join(','),
        author: params?.author,
        orderby: params?.orderby || 'date',
        order: params?.order || 'desc',
        parent: params?.parent,
        meta_key: params?.meta_key,
        meta_value: params?.meta_value,
      },
    });

    return {
      items: response.data,
      total: parseInt(response.headers['x-wp-total'] || '0'),
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '0'),
    };
  } catch (error) {
    console.error(`Error fetching WordPress ${postType}:`, error);
    throw error;
  }
}

/**
 * Fetch all published posts from WordPress
 * @param params Query parameters for filtering posts
 */
export async function getWordPressPosts(params?: {
  per_page?: number;
  page?: number;
  search?: string;
  categories?: number[];
  tags?: number[];
  author?: number;
  orderby?: 'date' | 'relevance' | 'id' | 'title';
  order?: 'asc' | 'desc';
}) {
  const result = await getWordPressContent('posts', params);
  return {
    posts: result.items,
    total: result.total,
    totalPages: result.totalPages,
  };
}

/**
 * Fetch all published pages from WordPress
 * @param params Query parameters for filtering pages
 */
export async function getWordPressPages(params?: {
  per_page?: number;
  page?: number;
  search?: string;
  parent?: number;
  orderby?: 'date' | 'relevance' | 'id' | 'title' | 'menu_order';
  order?: 'asc' | 'desc';
  meta_key?: string;
  meta_value?: string;
}) {
  const result = await getWordPressContent('pages', params);
  return {
    pages: result.items,
    total: result.total,
    totalPages: result.totalPages,
  };
}

/**
 * Fetch event pages from WordPress (pages with 'is_event' meta field)
 * @param params Query parameters for filtering event pages
 */
export async function getWordPressEventPages(params?: {
  per_page?: number;
  page?: number;
  search?: string;
  orderby?: 'date' | 'title' | 'menu_order';
  order?: 'asc' | 'desc';
}) {
  const result = await getWordPressContent('pages', {
    ...params,
    meta_key: 'is_event',
    meta_value: '1',
  });
  return {
    pages: result.items,
    total: result.total,
    totalPages: result.totalPages,
  };
}

/**
 * Fetch content by slug (works for any post type)
 * @param slug Content slug
 * @param postType The type of content ('posts', 'pages', or custom post type)
 */
export async function getWordPressContentBySlug(
  slug: string,
  postType: WordPressPostType = 'posts'
) {
  try {
    const response = await axios.get<WordPressPost[]>(`${WP_API_BASE}/${postType}`, {
      params: {
        slug,
        status: 'publish',
        _embed: true,
      },
    });

    if (response.data.length === 0) {
      throw new Error(`${postType} not found`);
    }

    return response.data[0];
  } catch (error) {
    console.error(`Error fetching WordPress ${postType}:`, error);
    throw error;
  }
}

/**
 * Fetch a single post by slug
 * @param slug Post slug
 */
export async function getWordPressPostBySlug(slug: string) {
  return getWordPressContentBySlug(slug, 'posts');
}

/**
 * Fetch a single page by slug
 * @param slug Page slug
 */
export async function getWordPressPageBySlug(slug: string) {
  return getWordPressContentBySlug(slug, 'pages');
}

/**
 * Fetch content by ID (works for any post type)
 * @param id Content ID
 * @param postType The type of content ('posts', 'pages', or custom post type)
 */
export async function getWordPressContentById(
  id: number,
  postType: WordPressPostType = 'posts'
) {
  try {
    const response = await axios.get<WordPressPost>(`${WP_API_BASE}/${postType}/${id}`, {
      params: {
        _embed: true,
      },
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching WordPress ${postType}:`, error);
    throw error;
  }
}

/**
 * Fetch a single post by ID
 * @param id Post ID
 */
export async function getWordPressPostById(id: number) {
  return getWordPressContentById(id, 'posts');
}

/**
 * Fetch a single page by ID
 * @param id Page ID
 */
export async function getWordPressPageById(id: number) {
  return getWordPressContentById(id, 'pages');
}

/**
 * Fetch categories
 */
export async function getWordPressCategories(params?: {
  per_page?: number;
  page?: number;
  hide_empty?: boolean;
}) {
  try {
    const response = await axios.get<WordPressCategory[]>(`${WP_API_BASE}/categories`, {
      params: {
        per_page: params?.per_page || 100,
        page: params?.page || 1,
        hide_empty: params?.hide_empty !== false,
      },
    });

    return {
      categories: response.data,
      total: parseInt(response.headers['x-wp-total'] || '0'),
    };
  } catch (error) {
    console.error('Error fetching WordPress categories:', error);
    throw error;
  }
}

/**
 * Fetch authors
 */
export async function getWordPressAuthors(params?: {
  per_page?: number;
  page?: number;
}) {
  try {
    const response = await axios.get<WordPressAuthor[]>(`${WP_API_BASE}/users`, {
      params: {
        per_page: params?.per_page || 100,
        page: params?.page || 1,
      },
    });

    return {
      authors: response.data,
      total: parseInt(response.headers['x-wp-total'] || '0'),
    };
  } catch (error) {
    console.error('Error fetching WordPress authors:', error);
    throw error;
  }
}
