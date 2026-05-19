export interface GoogleAccount {
  id: string;
  googleEmail: string;
  expiresAt: string;
  scope: string;
  createdAt: string;
  updatedAt: string;
}

export interface Calendar {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
  accessRole?: string;
}

export interface CalendarBridge {
  id: string;
  userId: string;
  sourceAccountId: string;
  sourceCalendarId: string;
  targetAccountId: string;
  targetCalendarId: string;
  titleTemplate: string;
  syncPastDays: number;
  syncFutureDays: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  sourceAccount?: { id: string; googleEmail: string };
  targetAccount?: { id: string; googleEmail: string };
}

export interface SyncLog {
  id: string;
  bridgeId?: string;
  level: 'info' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface SyncResult {
  bridgeId: string;
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
}
