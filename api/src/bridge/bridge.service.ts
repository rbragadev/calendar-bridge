import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBridgeDto } from './dto/create-bridge.dto';
import { UpdateBridgeDto } from './dto/update-bridge.dto';

@Injectable()
export class BridgeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBridgeDto, userId: string) {
    const { sourceAccountId, sourceCalendarId, targetAccountId, targetCalendarId } = dto;

    if (sourceAccountId === targetAccountId && sourceCalendarId === targetCalendarId) {
      throw new BadRequestException('Source and target calendar cannot be the same');
    }

    const sourceAccount = await this.prisma.googleAccount.findFirst({ where: { id: sourceAccountId, userId } });
    if (!sourceAccount) throw new NotFoundException(`Source account ${sourceAccountId} not found`);

    const targetAccount = await this.prisma.googleAccount.findFirst({ where: { id: targetAccountId, userId } });
    if (!targetAccount) throw new NotFoundException(`Target account ${targetAccountId} not found`);

    const duplicate = await this.prisma.calendarBridge.findFirst({
      where: { userId, sourceAccountId, sourceCalendarId, targetAccountId, targetCalendarId },
    });
    if (duplicate) throw new ConflictException('A bridge with these exact settings already exists');

    return this.prisma.calendarBridge.create({
      data: {
        userId,
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

  async findAll(userId: string) {
    return this.prisma.calendarBridge.findMany({
      where: { userId },
      include: {
        sourceAccount: { select: { id: true, googleEmail: true } },
        targetAccount: { select: { id: true, googleEmail: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const bridge = await this.prisma.calendarBridge.findFirst({
      where: { id, userId },
      include: {
        sourceAccount: { select: { id: true, googleEmail: true } },
        targetAccount: { select: { id: true, googleEmail: true } },
      },
    });
    if (!bridge) throw new NotFoundException(`Bridge ${id} not found`);
    return bridge;
  }

  async update(id: string, dto: UpdateBridgeDto, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.calendarBridge.update({
      where: { id },
      data: dto,
      include: {
        sourceAccount: { select: { id: true, googleEmail: true } },
        targetAccount: { select: { id: true, googleEmail: true } },
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.calendarBridge.delete({ where: { id } });
    return { deleted: true };
  }

  async getLogs(bridgeId: string, userId: string, limit = 50) {
    await this.findOne(bridgeId, userId);
    return this.prisma.syncLog.findMany({
      where: { bridgeId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getAllLogs(userId: string, limit = 100) {
    const bridges = await this.prisma.calendarBridge.findMany({ where: { userId }, select: { id: true } });
    const bridgeIds = bridges.map((b) => b.id);
    return this.prisma.syncLog.findMany({
      where: { bridgeId: { in: bridgeIds } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
