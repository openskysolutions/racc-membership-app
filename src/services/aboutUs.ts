/**
 * Page Content Service - API calls for managing dynamic page content
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface PageContent {
  id: number;
  slug: string;
  title: string;
  content: string;
  lastModified: string;
  lastModifiedBy?: string;
  version: number;
}

class PageContentService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  /**
   * Get page content by slug
   */
  async getPageContent(slug: string): Promise<PageContent> {
    const response = await fetch(`${API_BASE_URL}/content/pages/${slug}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Return default content if none exists
        return {
          id: 0,
          slug,
          title: this.getDefaultTitle(slug),
          content: this.getDefaultContent(slug),
          lastModified: new Date().toISOString(),
          version: 1,
        };
      }
      throw new Error(`Failed to fetch page content: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update page content (admin only)
   */
  async updatePageContent(slug: string, title: string, content: string): Promise<PageContent> {
    const response = await fetch(`${API_BASE_URL}/content/pages/${slug}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        title,
        content,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update page content' }));
      throw new Error(error.error || 'Failed to update page content');
    }

    return response.json();
  }

  /**
   * Get page content history (admin only)
   */
  async getPageHistory(slug: string): Promise<PageContent[]> {
    const response = await fetch(`${API_BASE_URL}/content/pages/${slug}/history`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page history: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all pages (admin only)
   */
  async getAllPages(): Promise<PageContent[]> {
    const response = await fetch(`${API_BASE_URL}/content/pages`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pages: ${response.statusText}`);
    }

    return response.json();
  }

  private getDefaultTitle(slug: string): string {
    switch (slug) {
      case 'about-us-copy':
        return 'About the Richfield Area Chamber of Commerce';
      default:
        return 'Page Content';
    }
  }

  private getDefaultContent(slug: string): string {
    switch (slug) {
      case 'about-us-copy':
        return JSON.stringify({
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Welcome to the Richfield Area Chamber of Commerce. We are dedicated to strengthening our community through business collaboration, economic development, and member advocacy.',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 1, // Bold
                    mode: 'normal',
                    style: '',
                    text: 'Our Mission',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'heading',
                tag: 'h2',
                version: 1,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'To promote and support the growth and prosperity of businesses in the Richfield area through networking opportunities, advocacy, education, and community engagement.',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 1, // Bold
                    mode: 'normal',
                    style: '',
                    text: 'Our Vision',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'heading',
                tag: 'h2',
                version: 1,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'To be the leading voice for business in our community, fostering an environment where businesses thrive and contribute to the economic vitality of the Richfield area.',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        });
      default:
        return JSON.stringify({
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'This is a new page. Start editing to add content.',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        });
    }
  }
}

export const pageContentService = new PageContentService();