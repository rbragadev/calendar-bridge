import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { BridgeService } from './bridge.service';
import { SyncService } from '../sync/sync.service';
import { CreateBridgeDto } from './dto/create-bridge.dto';
import { UpdateBridgeDto } from './dto/update-bridge.dto';
import { GetUser } from '../auth/get-user.decorator';
import { AuthUser } from '../auth/jwt.types';

@Controller('bridges')
export class BridgeController {
  constructor(
    private readonly bridgeService: BridgeService,
    private readonly syncService: SyncService,
  ) {}

  @Post()
  create(@Body() dto: CreateBridgeDto, @GetUser() user: AuthUser) {
    return this.bridgeService.create(dto, user.id);
  }

  @Get()
  findAll(@GetUser() user: AuthUser) {
    return this.bridgeService.findAll(user.id);
  }

  @Get('logs')
  getAllLogs(@GetUser() user: AuthUser, @Query('limit') limit?: string) {
    return this.bridgeService.getAllLogs(user.id, limit ? Number.parseInt(limit) : 100);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: AuthUser) {
    return this.bridgeService.findOne(id, user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBridgeDto, @GetUser() user: AuthUser) {
    return this.bridgeService.update(id, dto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: AuthUser) {
    return this.bridgeService.remove(id, user.id);
  }

  @Post(':id/sync-now')
  async syncNow(@Param('id') id: string, @GetUser() user: AuthUser) {
    await this.bridgeService.findOne(id, user.id);
    return this.syncService.syncBridge(id);
  }

  @Post(':id/clear-sync')
  async clearSync(@Param('id') id: string, @GetUser() user: AuthUser) {
    await this.bridgeService.findOne(id, user.id);
    return this.syncService.clearBridgeSync(id);
  }

  @Get(':id/logs')
  getLogs(@Param('id') id: string, @GetUser() user: AuthUser, @Query('limit') limit?: string) {
    return this.bridgeService.getLogs(id, user.id, limit ? Number.parseInt(limit) : 50);
  }
}
