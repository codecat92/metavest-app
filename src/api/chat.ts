import { api, ApiResponse, getToken, BASE_URL } from './client';

export interface ChatLastMessage {
  id: number;
  type: number;
  content: string | null;
  sender_name: string | null;
  created_at: string;
}

export interface ChatGroupListItem {
  id: string;
  name: string;
  description: string | null;
  leader_id: string;
  member_count: number;
  unread_count: number;
  last_message: ChatLastMessage | null;
  updated_at: string;
}

export interface ChatGroupDetail {
  id: string;
  name: string;
  description: string | null;
  leader_id: string;
  is_leader: boolean;
  member_count: number;
}

export interface ChatMessage {
  id: number;
  group_id: string;
  sender_id: string;
  type: number; // 1: text | 2: image
  content: string | null;
  image_path: string | null;
  image_url: string | null;
  sender_name: string | null;
  sender_profile_image: string | null;
  created_at: string;
}

export interface ChatInvite {
  invite_id: number;
  group: { id: string; name: string; description: string | null };
  invited_by_name: string | null;
  created_at: string;
}

export interface ChatMember {
  user_id: string;
  name: string | null;
  profile_image_src: string | null;
  role: number;   // 1: leader | 2: member
  status: number; // 1: invited | 2: active
  joined_at: string | null;
}

export interface ChatUserSearch {
  id_user: string;
  name: string;
  profile_image_src: string | null;
}

export const chatApi = {
  listGroups: (page = 1) =>
    api.get<ApiResponse<ChatGroupListItem[]>>(`/chat/groups?page=${page}`),

  createGroup: (name: string, description?: string) =>
    api.post<ApiResponse<ChatGroupDetail>>('/chat/groups', { name, description }),

  groupDetail: (id: string) =>
    api.get<ApiResponse<ChatGroupDetail>>(`/chat/groups/${id}`),

  disband: (id: string) =>
    api.post<ApiResponse<null>>(`/chat/groups/${id}/disband`),

  leave: (id: string) =>
    api.post<ApiResponse<null>>(`/chat/groups/${id}/leave`),

  members: (id: string, page = 1) =>
    api.get<ApiResponse<ChatMember[]>>(`/chat/groups/${id}/members?page=${page}`),

  invite: (id: string, userId: string) =>
    api.post<ApiResponse<null>>(`/chat/groups/${id}/invite`, { user_id: userId }),

  removeMember: (id: string, userId: string) =>
    api.post<ApiResponse<null>>(`/chat/groups/${id}/remove`, { user_id: userId }),

  invites: (page = 1) =>
    api.get<ApiResponse<ChatInvite[]>>(`/chat/invites?page=${page}`),

  acceptInvite: (inviteId: number) =>
    api.post<ApiResponse<null>>(`/chat/invites/${inviteId}/accept`),

  rejectInvite: (inviteId: number) =>
    api.post<ApiResponse<null>>(`/chat/invites/${inviteId}/reject`),

  messages: (id: string, cursor?: number, limit = 30) =>
    api.get<ApiResponse<ChatMessage[]>>(
      `/chat/groups/${id}/messages?limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`
    ),

  latestMessages: (id: string, after: number, limit = 50) =>
    api.get<ApiResponse<ChatMessage[]>>(
      `/chat/groups/${id}/messages/latest?after=${after}&limit=${limit}`
    ),

  sendText: (id: string, content: string) =>
    api.post<ApiResponse<ChatMessage>>(`/chat/groups/${id}/messages`, { type: 1, content }),

  sendImage: async (id: string, imageUri: string) => {
    const formData = new FormData();
    formData.append('type', '2');
    const filename = imageUri.split('/').pop() ?? 'chat.jpg';
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    formData.append('image_file', { uri: imageUri, name: filename, type: mimeType } as any);

    const token = getToken();
    const res = await fetch(`${BASE_URL}/chat/groups/${id}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`);
    return json as ApiResponse<ChatMessage>;
  },

  markRead: (id: string, lastMessageId: number) =>
    api.post<ApiResponse<null>>(`/chat/groups/${id}/read`, { last_message_id: lastMessageId }),

  unreadCount: () =>
    api.get<ApiResponse<{ count: number }>>('/chat/unread-count'),

  searchUsers: (q: string) =>
    api.get<ApiResponse<ChatUserSearch[]>>(`/chat/users/search?q=${encodeURIComponent(q)}`),
};
