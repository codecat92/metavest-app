import { api, ApiResponse } from './client';

export interface NewsItem {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  source: string | null;
  published_at: string;
  created_at: string;
}

export interface NewsListResponse {
  data: NewsItem[];
  data_count: number;
}

export const newsApi = {
  getAll: () =>
    api.get<NewsListResponse>('/news'),

  getByKeyword: (keyword: string) =>
    api.get<NewsListResponse>(`/news/${keyword}`),
};
