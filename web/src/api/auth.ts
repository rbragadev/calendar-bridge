import api from './client';

export function getToken(): string | null {
  return localStorage.getItem('cb_token');
}

export function setToken(token: string) {
  localStorage.setItem('cb_token', token);
}

export function clearToken() {
  localStorage.removeItem('cb_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export async function getLoginUrl(): Promise<string> {
  const { data } = await api.get<{ url: string }>('/auth/google/url');
  return data.url;
}
