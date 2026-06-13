import { getToken } from './client';

const BASE_URL = 'https://metavest-backend.onrender.com/api';

export const profileApi = {
  editProfile: async (fields: Record<string, string>): Promise<{ message: string; data?: any }> => {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/profile/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(fields),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Update failed');
    return json;
  },

  changePassword: async (userId: string, oldPassword: string, newPassword: string): Promise<{ message: string }> => {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/profile/edit/password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: userId, old_password: oldPassword, new_password: newPassword }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Update failed');
    return json;
  },

  uploadPhoto: async (imageUri: string): Promise<{ message: string; data?: any }> => {
    const token = getToken();
    const formData = new FormData();

    const filename = imageUri.split('/').pop() ?? 'photo.jpg';
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    formData.append('image_file', {
      uri: imageUri,
      name: filename,
      type: mimeType,
    } as any);

    const response = await fetch(`${BASE_URL}/profile/profile-image/edit`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Upload failed');
    return json;
  },
};
