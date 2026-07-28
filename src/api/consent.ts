import { api } from './client';

export interface ConsentData {
  id: number;
  code: string;
  title: string;
  content: string;
  version: number;
  already_agreed: boolean;
}

export const consentApi = {
  get: (code: string) =>
    api.get<{ message: string; data: ConsentData }>(`/consent/${code}`),

  submit: (code: string) =>
    api.post<{ message: string; data: { id: number; consent_version: number; agreed_at: string } }>('/consent/submit', { code }),
};
