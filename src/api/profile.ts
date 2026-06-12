import { getToken } from './client';

const BASE_URL = 'http://192.168.1.24:8000/api';

export const profileApi = {
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
