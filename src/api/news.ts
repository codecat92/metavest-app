import { api, ApiResponse } from './client';

export interface Article {
  id: number;
  title: string;
  content: string;
  image_src?: string | null;
  writer_id?: number;
  created_at: string;
  media_src?: string | null;
  media_link?: string | null;
}

export interface ArticleListResponse {
  data: Article[];
  data_count: number;
}

export const newsApi = {
  getArticles: () =>
    api.get<ArticleListResponse>('/article-event?page=1'),

  getArticleById: (id: number) =>
    api.get<ApiResponse<Article>>(`/article-event/${id}`),

  getAcademy: () =>
    api.get<ArticleListResponse>('/academy-article?page=1'),
};
