import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { calendar_v3 } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleService } from '../google/google.service';
import { CalendarBridge } from '@prisma/client';

export interface SyncResult {
  bridgeId: string;
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleService: GoogleService,
  ) {}

  async syncBridge(bridgeId: string): Promise<SyncResult> {
    const bridge = await this.prisma.calendarBridge.findUnique({
      where: { id: bridgeId },
      include: { sourceAccount: true, targetAccount: true },
    });

    if (!bridge) {
      throw new NotFoundException(`Bridge ${bridgeId} not found`);
    }

    const result: SyncResult = { bridgeId, created: 0, updated: 0, deleted: 0, errors: [] };

    try {
      const now = new Date();
      const timeMin = new Date(now);
      timeMin.setDate(timeMin.getDate() - bridge.syncPastDays);
      const timeMax = new Date(now);
      timeMax.setDate(timeMax.getDate() + bridge.syncFutureDays);

      const sourceEvents = await this.googleService.listEvents(
        bridge.sourceAccountId,
        bridge.sourceCalendarId,
        timeMin,
        timeMax,
      );

      const relevantEvents = sourceEvents.filter((event) => {
        if (event.status === 'cancelled') return false;
        if (event.transparency === 'transparent') return false;
        const createdBy = event.extendedProperties?.private?.['createdBy'];
        if (createdBy === 'calendar-bridge') return false;
        return true;
      });

      const existingSyncEvents = await this.prisma.bridgeSyncEvent.findMany({
        where: { bridgeId, status: 'active' },
      });

      const existingMap = new Map(existingSyncEvents.map((e) => [e.sourceEventId, e]));
      const sourceIds = new Set(relevantEvents.map((e) => e.id));

      for (const syncEvent of existingSyncEvents) {
        if (!sourceIds.has(syncEvent.sourceEventId)) {
          try {
            if (syncEvent.targetEventId) {
              await this.googleService.deleteEvent(
                bridge.targetAccountId,
                bridge.targetCalendarId,
                syncEvent.targetEventId,
              );
            }
            await this.prisma.bridgeSyncEvent.update({
              where: { id: syncEvent.id },
              data: { status: 'deleted' },
            });
            result.deleted++;
          } catch (err) {
            const msg = `Failed to delete target event ${syncEvent.targetEventId}: ${err.message}`;
            result.errors.push(msg);
            this.logger.error(msg);
          }
        }
      }

      for (const sourceEvent of relevantEvents) {
        const existing = existingMap.get(sourceEvent.id);
        const targetBody = this.buildTargetEvent(sourceEvent, bridge);

        try {
          if (!existing) {
            const targetEvent = await this.googleService.createEvent(
              bridge.targetAccountId,
              bridge.targetCalendarId,
              targetBody,
            );

            await this.prisma.bridgeSyncEvent.upsert({
              where: { bridgeId_sourceEventId: { bridgeId, sourceEventId: sourceEvent.id } },
              create: {
                bridgeId,
                sourceEventId: sourceEvent.id,
                targetEventId: targetEvent.id,
                sourceUpdatedAt: sourceEvent.updated ? new Date(sourceEvent.updated) : null,
                startTime: this.getStartTime(sourceEvent),
                endTime: this.getEndTime(sourceEvent),
                status: 'active',
              },
              update: {
                targetEventId: targetEvent.id,
                sourceUpdatedAt: sourceEvent.updated ? new Date(sourceEvent.updated) : null,
                startTime: this.getStartTime(sourceEvent),
                endTime: this.getEndTime(sourceEvent),
                status: 'active',
              },
            });
            result.created++;
          } else {
            const sourceUpdated = sourceEvent.updated ? new Date(sourceEvent.updated) : null;
            const needsUpdate =
              !existing.sourceUpdatedAt ||
              (sourceUpdated && sourceUpdated > existing.sourceUpdatedAt);

            if (needsUpdate && existing.targetEventId) {
              await this.googleService.updateEvent(
                bridge.targetAccountId,
                bridge.targetCalendarId,
                existing.targetEventId,
                targetBody,
              );
              await this.prisma.bridgeSyncEvent.update({
                where: { id: existing.id },
                data: {
                  sourceUpdatedAt: sourceUpdated,
                  startTime: this.getStartTime(sourceEvent),
                  endTime: this.getEndTime(sourceEvent),
                },
              });
              result.updated++;
            }
          }
        } catch (err) {
          const msg = `Failed to process source event ${sourceEvent.id}: ${err.message}`;
          result.errors.push(msg);
          this.logger.error(msg);
        }
      }

      await this.prisma.syncLog.create({
        data: {
          bridgeId,
          level: result.errors.length > 0 ? 'error' : 'info',
          message: `Sync completed: ${result.created} created, ${result.updated} updated, ${result.deleted} deleted`,
          metadata: { ...result },
        },
      });

      this.logger.log(
        `Bridge ${bridgeId}: created=${result.created}, updated=${result.updated}, deleted=${result.deleted}, errors=${result.errors.length}`,
      );
    } catch (err) {
      const msg = `Sync failed for bridge ${bridgeId}: ${err.message}`;
      result.errors.push(msg);
      this.logger.error(msg);
      await this.prisma.syncLog.create({
        data: {
          bridgeId,
          level: 'error',
          message: msg,
          metadata: { error: err.message },
        },
      });
    }

    return result;
  }

  async clearBridgeSync(bridgeId: string): Promise<{ deleted: number; errors: string[] }> {
    const bridge = await this.prisma.calendarBridge.findUnique({ where: { id: bridgeId } });
    if (!bridge) throw new NotFoundException(`Bridge ${bridgeId} not found`);

    const syncEvents = await this.prisma.bridgeSyncEvent.findMany({
      where: { bridgeId, status: 'active' },
    });

    let deleted = 0;
    const errors: string[] = [];

    for (const syncEvent of syncEvents) {
      if (syncEvent.targetEventId) {
        try {
          await this.googleService.deleteEvent(
            bridge.targetAccountId,
            bridge.targetCalendarId,
            syncEvent.targetEventId,
          );
          deleted++;
        } catch (err) {
          errors.push(`Failed to delete ${syncEvent.targetEventId}: ${err.message}`);
        }
      }
    }

    await this.prisma.bridgeSyncEvent.deleteMany({ where: { bridgeId } });

    await this.prisma.syncLog.create({
      data: {
        bridgeId,
        level: errors.length > 0 ? 'error' : 'info',
        message: `Sync cleared: ${deleted} events deleted from target calendar`,
        metadata: { deleted, errors },
      },
    });

    this.logger.log(`Bridge ${bridgeId} cleared: ${deleted} events deleted`);
    return { deleted, errors };
  }

  async syncAllEnabled(): Promise<{
    success: boolean;
    bridgesProcessed: number;
    created: number;
    updated: number;
    deleted: number;
    errors: string[];
  }> {
    const bridges = await this.prisma.calendarBridge.findMany({
      where: { enabled: true },
    });

    let totalCreated = 0;
    let totalUpdated = 0;
    let totalDeleted = 0;
    const allErrors: string[] = [];

    for (const bridge of bridges) {
      const result = await this.syncBridge(bridge.id);
      totalCreated += result.created;
      totalUpdated += result.updated;
      totalDeleted += result.deleted;
      allErrors.push(...result.errors);
    }

    return {
      success: allErrors.length === 0,
      bridgesProcessed: bridges.length,
      created: totalCreated,
      updated: totalUpdated,
      deleted: totalDeleted,
      errors: allErrors,
    };
  }

  private buildTargetEvent(
    sourceEvent: calendar_v3.Schema$Event,
    bridge: CalendarBridge,
  ): calendar_v3.Schema$Event {
    const isAllDay = !!sourceEvent.start?.date;

    return {
      summary: bridge.titleTemplate || 'Busy',
      description: 'Blocked by Calendar Bridge',
      visibility: 'private',
      transparency: 'opaque',
      start: isAllDay
        ? { date: sourceEvent.start.date }
        : { dateTime: sourceEvent.start?.dateTime, timeZone: sourceEvent.start?.timeZone },
      end: isAllDay
        ? { date: sourceEvent.end.date }
        : { dateTime: sourceEvent.end?.dateTime, timeZone: sourceEvent.end?.timeZone },
      extendedProperties: {
        private: {
          createdBy: 'calendar-bridge',
          bridgeId: bridge.id,
          sourceEventId: sourceEvent.id,
        },
      },
    };
  }

  private getStartTime(event: calendar_v3.Schema$Event): Date {
    if (event.start?.dateTime) return new Date(event.start.dateTime);
    if (event.start?.date) return new Date(event.start.date);
    return new Date();
  }

  private getEndTime(event: calendar_v3.Schema$Event): Date {
    if (event.end?.dateTime) return new Date(event.end.dateTime);
    if (event.end?.date) return new Date(event.end.date);
    return new Date();
  }
}
