import { api, ApiResponse } from './client';

export interface Academy {
  id: number;
  trader_id: string;
  name: string;
  description: string | null;
  icon_src?: string | null;
}

export interface AcademyClass {
  id: number;
  academy_id: number;
  name: string;
  price: number;
  description: string | null;
}

export interface AcademyArticle {
  id: number;
  class_id: number;
  title: string;
  content: string;
  chapter: number;
}

export interface AcademyLivestream {
  id: number;
  class_id: number;
  title: string;
  link: string;
  chapter: number;
}

export const academyApi = {
  getAcademies: () =>
    api.get<ApiResponse<Academy[]>>('/user-traders/academies/'),

  getAcademyById: (id: number) =>
    api.get<ApiResponse<Academy>>(`/user-traders/academies/${id}`),

  getClasses: () =>
    api.get<ApiResponse<AcademyClass[]>>('/user-traders/academies/classes/all'),

  getClassById: (id: number) =>
    api.get<ApiResponse<AcademyClass>>(`/user-traders/academies/classes/${id}`),

  getArticles: () =>
    api.get<ApiResponse<AcademyArticle[]>>('/user-traders/academies/articles/all'),

  getLivestreams: () =>
    api.get<ApiResponse<AcademyLivestream[]>>('/user-traders/academies/livestreams/all'),
};
