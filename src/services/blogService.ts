import { api } from './apiClient';
import { compressImage } from '@/lib/imageCompression';

// Types
export interface PostCategory {
  id: number;
  title: string;
  slug: string;
  img?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    posts: number;
  };
}

export interface PostAuthor {
  id: number;
  name: string;
  slug: string;
  image: string;
  bio?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    posts: number;
  };
}

export interface Gallery {
  id: string;
  postId: string;
  title: string;
  images: string[];
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  title: string;
  metadata?: string | null;
  slug: string;
  authorId: number;
  categoryId: number;
  tags: string[];
  mainImage: string;
  body: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: number;
    name: string;
    slug: string;
    image: string;
    bio?: string | null;
    description?: string | null;
  };
  category?: {
    id: number;
    title: string;
    slug: string;
    description?: string | null;
  };
  galleries?: Gallery[];
}

// Post Categories
export const postCategoryService = {
  async list(): Promise<PostCategory[]> {
    const response = await api.get('/post-categories');
    const json = await response.json();
    return json.data;
  },

  async get(id: number): Promise<PostCategory> {
    const response = await api.get(`/post-categories/${id}`);
    const json = await response.json();
    return json.data;
  },

  async create(data: {
    title: string;
    slug?: string;
    img?: string;
    description?: string;
  }): Promise<PostCategory> {
    const response = await api.post('/post-categories', data);
    const json = await response.json();
    return json.data;
  },

  async update(
    id: number,
    data: Partial<{
      title: string;
      slug: string;
      img: string;
      description: string;
    }>
  ): Promise<PostCategory> {
    const response = await api.put(`/post-categories/${id}`, data);
    const json = await response.json();
    return json.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/post-categories/${id}`);
  },
};

// Post Authors
export const postAuthorService = {
  async list(): Promise<PostAuthor[]> {
    const response = await api.get('/post-authors');
    const json = await response.json();
    return json.data;
  },

  async get(id: number): Promise<PostAuthor> {
    const response = await api.get(`/post-authors/${id}`);
    const json = await response.json();
    return json.data;
  },

  async create(data: {
    name: string;
    slug?: string;
    image: string;
    bio?: string;
    description?: string;
  }): Promise<PostAuthor> {
    const response = await api.post('/post-authors', data);
    const json = await response.json();
    return json.data;
  },

  async update(
    id: number,
    data: Partial<{
      name: string;
      slug: string;
      image: string;
      bio: string;
      description: string;
    }>
  ): Promise<PostAuthor> {
    const response = await api.put(`/post-authors/${id}`, data);
    const json = await response.json();
    return json.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/post-authors/${id}`);
  },
};

// Posts
export const postService = {
  async list(params?: {
    categoryId?: number;
    authorId?: number;
    tag?: string;
    limit?: number;
    skip?: number;
    includeUnpublished?: boolean;
  }): Promise<Post[]> {
    const queryString = params ? '?' + new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    const response = await api.get(`/posts${queryString}`);
    const json = await response.json();
    return json.data;
  },

  async getBySlug(slug: string): Promise<Post> {
    const response = await api.get(`/posts/slug/${slug}`);
    const json = await response.json();
    return json.data;
  },

  async get(id: string): Promise<Post> {
    const response = await api.get(`/posts/${id}`);
    const json = await response.json();
    return json.data;
  },

  async create(data: {
    title: string;
    metadata?: string;
    slug?: string;
    authorId?: number; // Optional, backend will auto-assign
    categoryId: number;
    tags?: string[];
    mainImage: string;
    body: string;
  }): Promise<Post> {
    const response = await api.post('/posts', data);
    const json = await response.json();
    return json.data;
  },

  async update(
    id: string,
    data: Partial<{
      title: string;
      metadata: string;
      slug: string;
      authorId: number;
      categoryId: number;
      tags: string[];
      mainImage: string;
      body: string;
      published: boolean;
    }>
  ): Promise<Post> {
    const response = await api.put(`/posts/${id}`, data);
    const json = await response.json();
    return json.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/posts/${id}`);
  },
};

// Media upload for blog images
export const uploadBlogImage = async (file: File): Promise<string> => {
  // Compress image before upload
  const compressedFile = await compressImage(file);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const response = await api.post('/medias/upload-blog-image', {
          fileData: base64Data,
          fileName: compressedFile.name,
          mimeType: compressedFile.type,
        });
        const json = await response.json();
        resolve(json.mediaUrl);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(compressedFile);
  });
};

// Gallery management
export const galleryService = {
  async create(postId: string, data: { title: string; images: string[] }): Promise<Gallery> {
    const response = await api.post(`/posts/${postId}/galleries`, data);
    const json = await response.json();
    return json.data;
  },

  async update(id: string, data: Partial<{ title: string; images: string[] }>): Promise<Gallery> {
    const response = await api.put(`/posts/galleries/${id}`, data);
    const json = await response.json();
    return json.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/posts/galleries/${id}`);
  },

  async reorder(postId: string, galleryIds: string[]): Promise<void> {
    await api.put(`/posts/${postId}/galleries/reorder`, { galleryIds });
  },
};
