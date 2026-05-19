import api from './client';
import { CalendarBridge, SyncResult } from '../types';

export interface CreateBridgePayload {
  sourceAccountId: string;
  sourceCalendarId: string;
  targetAccountId: string;
  targetCalendarId: string;
  titleTemplate?: string;
  syncPastDays?: number;
  syncFutureDays?: number;
  enabled?: boolean;
}

export async function listBridges(): Promise<CalendarBridge[]> {
  const { data } = await api.get<CalendarBridge[]>('/bridges');
  return data;
}

export async function getBridge(id: string): Promise<CalendarBridge> {
  const { data } = await api.get<CalendarBridge>(`/bridges/${id}`);
  return data;
}

export async function createBridge(payload: CreateBridgePayload): Promise<CalendarBridge> {
  const { data } = await api.post<CalendarBridge>('/bridges', payload);
  return data;
}

export async function updateBridge(
  id: string,
  payload: Partial<CreateBridgePayload>,
): Promise<CalendarBridge> {
  const { data } = await api.patch<CalendarBridge>(`/bridges/${id}`, payload);
  return data;
}

export async function deleteBridge(id: string): Promise<void> {
  await api.delete(`/bridges/${id}`);
}

export async function syncBridge(id: string): Promise<SyncResult> {
  const { data } = await api.post<SyncResult>(`/bridges/${id}/sync-now`);
  return data;
}

export async function clearBridgeSync(id: string): Promise<{ deleted: number; errors: string[] }> {
  const { data } = await api.post<{ deleted: number; errors: string[] }>(`/bridges/${id}/clear-sync`);
  return data;
}
