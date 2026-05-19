import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { google, calendar_v3 } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../crypto/crypto.service';

@Injectable()
export class GoogleService {
  private readonly logger = new Logger(GoogleService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  private createOAuth2Client(): OAuth2Client {
    return new OAuth2Client(
      this.config.get('GOOGLE_CLIENT_ID'),
      this.config.get('GOOGLE_CLIENT_SECRET'),
      this.config.get('GOOGLE_REDIRECT_URI'),
    );
  }

  getAuthorizationUrl(userId: string): string {
    const client = this.createOAuth2Client();
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'select_account consent',
      scope: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
        'openid',
        'email',
        'profile',
      ],
      state: userId,
    });
  }

  async exchangeCodeAndSave(code: string, userId: string): Promise<{ email: string }> {
    const client = this.createOAuth2Client();
    const { tokens } = await client.getToken(code);

    if (!tokens.refresh_token) {
      throw new Error('No refresh_token received. Revoke app access in Google and try again.');
    }

    client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const { data: userInfo } = await oauth2.userinfo.get();
    const email = userInfo.email;

    await this.prisma.googleAccount.upsert({
      where: { userId_googleEmail: { userId, googleEmail: email } },
      update: {
        accessToken: this.crypto.encrypt(tokens.access_token || ''),
        refreshToken: this.crypto.encrypt(tokens.refresh_token),
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000),
        scope: tokens.scope || '',
      },
      create: {
        userId,
        googleEmail: email,
        accessToken: this.crypto.encrypt(tokens.access_token || ''),
        refreshToken: this.crypto.encrypt(tokens.refresh_token),
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000),
        scope: tokens.scope || '',
      },
    });

    return { email };
  }

  async getAuthenticatedClient(accountId: string): Promise<OAuth2Client> {
    const account = await this.prisma.googleAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new NotFoundException(`Google account ${accountId} not found`);

    const client = this.createOAuth2Client();
    client.setCredentials({
      refresh_token: this.crypto.decrypt(account.refreshToken),
      access_token: account.accessToken ? this.crypto.decrypt(account.accessToken) : undefined,
      expiry_date: account.expiresAt.getTime(),
    });

    client.on('tokens', async (tokens) => {
      const updateData: any = {};
      if (tokens.access_token) updateData.accessToken = this.crypto.encrypt(tokens.access_token);
      if (tokens.expiry_date) updateData.expiresAt = new Date(tokens.expiry_date);
      if (tokens.refresh_token) updateData.refreshToken = this.crypto.encrypt(tokens.refresh_token);
      await this.prisma.googleAccount.update({ where: { id: accountId }, data: updateData });
    });

    return client;
  }

  async listAccounts(userId: string) {
    return this.prisma.googleAccount.findMany({
      where: { userId },
      select: { id: true, googleEmail: true, expiresAt: true, scope: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteAccount(accountId: string, userId: string) {
    const account = await this.prisma.googleAccount.findFirst({ where: { id: accountId, userId } });
    if (!account) throw new NotFoundException(`Account ${accountId} not found`);
    await this.prisma.googleAccount.delete({ where: { id: accountId } });
    return { deleted: true };
  }

  async listCalendars(accountId: string): Promise<calendar_v3.Schema$CalendarListEntry[]> {
    const authClient = await this.getAuthenticatedClient(accountId);
    const cal = google.calendar({ version: 'v3', auth: authClient });
    const { data } = await cal.calendarList.list({ minAccessRole: 'writer' });
    return data.items || [];
  }

  async listEvents(accountId: string, calendarId: string, timeMin: Date, timeMax: Date): Promise<calendar_v3.Schema$Event[]> {
    const authClient = await this.getAuthenticatedClient(accountId);
    const cal = google.calendar({ version: 'v3', auth: authClient });
    const allEvents: calendar_v3.Schema$Event[] = [];
    let pageToken: string | undefined;

    do {
      const { data } = await cal.events.list({
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        pageToken,
        maxResults: 250,
      });
      if (data.items) allEvents.push(...data.items);
      pageToken = data.nextPageToken || undefined;
    } while (pageToken);

    return allEvents;
  }

  async createEvent(accountId: string, calendarId: string, event: calendar_v3.Schema$Event): Promise<calendar_v3.Schema$Event> {
    const authClient = await this.getAuthenticatedClient(accountId);
    const cal = google.calendar({ version: 'v3', auth: authClient });
    const { data } = await cal.events.insert({ calendarId, requestBody: event });
    return data;
  }

  async updateEvent(accountId: string, calendarId: string, eventId: string, event: calendar_v3.Schema$Event): Promise<calendar_v3.Schema$Event> {
    const authClient = await this.getAuthenticatedClient(accountId);
    const cal = google.calendar({ version: 'v3', auth: authClient });
    const { data } = await cal.events.update({ calendarId, eventId, requestBody: event });
    return data;
  }

  async deleteEvent(accountId: string, calendarId: string, eventId: string): Promise<void> {
    try {
      const authClient = await this.getAuthenticatedClient(accountId);
      const cal = google.calendar({ version: 'v3', auth: authClient });
      await cal.events.delete({ calendarId, eventId });
    } catch (err: any) {
      if (err?.code === 404 || err?.code === 410) {
        this.logger.warn(`Event ${eventId} already deleted`);
        return;
      }
      throw err;
    }
  }
}
