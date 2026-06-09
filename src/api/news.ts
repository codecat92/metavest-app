import { api } from './client';

export interface NewsItem {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  source: string | null;
  published_at: string;
  created_at: string;
}

export interface NewsResponse {
  data: NewsItem[];
  current_page: number;
  last_page: number;
  total: number;
}

export const newsApi = {
  getAll: () => api.get<NewsResponse>('/news'),
  getByKeyword: (keyword: string) => api.get<NewsResponse>(`/news/${keyword}`),
};