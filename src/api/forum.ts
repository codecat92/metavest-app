import { api, ApiResponse } from './client';

export interface ForumPost {
  id: number;
  title: string;
  content: string;
  poster_id: string;
  poster_type: number;
  likes: number;
  views: number;
  shares: number;
  poster_name?: string;
  poster_type_name?: string;
  poster_profile_image?: string | null;
  comments?: ForumComment[];
  created_at: string;
}

export interface ForumComment {
  id: number;
  post_id: number;
  comment_id: number | null;
  content: string;
  commenter_id: string;
  commenter_type: number;
  likes: number;
  commenter_name?: string;
  created_at: string;
}

export interface ForumListResponse {
  data: ForumPost[];
  data_count: number;
}

export const forumApi = {
  getPosts: (page = 1) =>
    api.get<ForumListResponse>(`/forums/posts/all?page=${page}`),

  getPostById: (id: number) =>
    api.get<ApiResponse<ForumPost>>(`/forums/posts/${id}`),

  getComments: (postId: number, page = 1) =>
    api.get<ForumListResponse>(`/forums/comments/by-post/${postId}?page=${page}`),

  createPost: (title: string, content: string, posterType = 1) =>
    api.post<ApiResponse<ForumPost>>('/forums/users/posts/create', {
      title,
      content,
      poster_type: posterType,
    }),

  createComment: (postId: number, content: string, commenterType = 1) =>
    api.post<ApiResponse<ForumComment>>('/forums/users/comments/create', {
      post_id: postId,
      content,
      commenter_type: commenterType,
      comment_id: null,
    }),

  likePost: (id: number) =>
    api.get<ApiResponse<any>>(`/forums/users/posts/like/${id}`),

  sharePost: (id: number) =>
    api.get<ApiResponse<any>>(`/forums/users/posts/share/${id}`),
};
