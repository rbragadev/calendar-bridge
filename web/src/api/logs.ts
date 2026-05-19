import api from './client';
import { SyncLog } from '../types';

export async function getAllLogs(limit = 100): Promise<SyncLog[]> {
  const { data } = await api.get<SyncLog[]>(`/bridges/logs?limit=${limit}`);
  return data;
}

export async function getBridgeLogs(bridgeId: string, limit = 50): Promise<SyncLog[]> {
  const { data } = await api.get<SyncLog[]>(`/bridges/${bridgeId}/logs?limit=${limit}`);
  return data;
}
