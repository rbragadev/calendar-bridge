import api from './client';
import { GoogleAccount, Calendar } from '../types';

export async function getOAuthUrl(): Promise<string> {
  const { data } = await api.get<{ url: string }>('/google/oauth/url');
  return data.url;
}

export async function listAccounts(): Promise<GoogleAccount[]> {
  const { data } = await api.get<GoogleAccount[]>('/google/accounts');
  return data;
}

export async function deleteAccount(id: string): Promise<void> {
  await api.delete(`/google/accounts/${id}`);
}

export async function listCalendars(accountId: string): Promise<Calendar[]> {
  const { data } = await api.get<Calendar[]>(`/google/accounts/${accountId}/calendars`);
  return data;
}
