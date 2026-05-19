import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService, DEFAULT_USER_ID } from '../prisma/prisma.service';
import { CreateBridgeDto } from './dto/create-bridge.dto';
import { UpdateBridgeDto } from './dto/update-bridge.dto';

@Injectable()
export class BridgeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBridgeDto) {
    const { sourceAccountId, sourceCalendarId, targetAccountId, targetCalendarId } = dto;

    if (sourceAccountId === targetAccountId && sourceCalendarId === targetCalendarId) {
      throw new BadRequestException('Source and target calendar cannot be the same');
    }

    const existingAccount = await this.prisma.googleAccount.findFirst({
      where: { id: sourceAccountId, userId: DEFAULT_USER_ID },
    });
    if (!existingAccount) {
      throw new NotFoundException(`Source account ${sourceAccountId} not found`);
    }

    const existingTargetAccount = await this.prisma.googleAccount.findFirst({
      where: { id: targetAccountId, userId: DEFAULT_USER_ID },
    });
    if (!existingTargetAccount) {
      throw new NotFoundException(`Target account ${targetAccountId} not found`);
    }

    const duplicate = await this.prisma.calendarBridge.findFirst({
      where: {
        userId: DEFAULT_USER_ID,
        sourceAccountId,
        sourceCalendarId,
        targetAccountId,
        targetCalendarId,
      },
    });
    if (duplicate) {
      throw new ConflictException('A bridge with these exact settings already exists');
    }

    return this.prisma.calendarBridge.create({
      data: {
        userId: DEFAULT_USER_ID,
        sourceAccountId,
        sourceCalendarId,
        targetAccountId,
        targetCalendarId,
        titleTemplate: dto.titleTemplate ?? 'Busy',
        syncPastDays: dto.syncPastDays ?? 1,
        syncFutureDays: dto.syncFutureDays ?? 30,
        enabled: dto.enabled ?? true,
      },
      include: {
        sourceAccount: { select: { id: true, googleEmail: true } },
        targetAccount: { select: { id: true, googleEmail: true } },
      },
    });
  }

  async findAll() {
    return this.prisma.calendarBridge.findMany({
      where: { userId: DEFAULT_USER_ID },
      include: {
        sourceAccount: { select: { id: true, googleEmail: true } },
        targetAccount: { select: { id: true, googleEmail: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const bridge = await this.prisma.calendarBridge.findFirst({
      where: { id, userId: DEFAULT_USER_ID },
      include: {
        sourceAccount: { select: { id: true, googleEmail: true } },
        targetAccount: { select: { id: true, googleEmail: true } },
      },
    });
    if (!bridge) {
      throw new NotFoundException(`Bridge ${id} not found`);
    }
    return bridge;
  }

  async update(id: string, dto: UpdateBridgeDto) {
    await this.findOne(id);
    return this.prisma.calendarBridge.update({
      where: { id },
      data: dto,
      include: {
        sourceAccount: { select: { id: true, googleEmail: true } },
        targetAccount: { select: { id: true, googleEmail: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.calendarBridge.delete({ where: { id } });
    return { deleted: true };
  }

  async getLogs(bridgeId: string, limit = 50) {
    await this.findOne(bridgeId);
    return this.prisma.syncLog.findMany({
      where: { bridgeId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getAllLogs(limit = 100) {
    return this.prisma.syncLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
