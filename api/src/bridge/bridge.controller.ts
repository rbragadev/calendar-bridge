import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { BridgeService } from './bridge.service';
import { SyncService } from '../sync/sync.service';
import { CreateBridgeDto } from './dto/create-bridge.dto';
import { UpdateBridgeDto } from './dto/update-bridge.dto';

@Controller('bridges')
export class BridgeController {
  constructor(
    private readonly bridgeService: BridgeService,
    private readonly syncService: SyncService,
  ) {}

  @Post()
  create(@Body() dto: CreateBridgeDto) {
    return this.bridgeService.create(dto);
  }

  @Get()
  findAll() {
    return this.bridgeService.findAll();
  }

  @Get('logs')
  getAllLogs(@Query('limit') limit?: string) {
    return this.bridgeService.getAllLogs(limit ? parseInt(limit) : 100);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bridgeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBridgeDto) {
    return this.bridgeService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bridgeService.remove(id);
  }

  @Post(':id/sync-now')
  async syncNow(@Param('id') id: string) {
    await this.bridgeService.findOne(id);
    return this.syncService.syncBridge(id);
  }

  @Post(':id/clear-sync')
  async clearSync(@Param('id') id: string) {
    await this.bridgeService.findOne(id);
    return this.syncService.clearBridgeSync(id);
  }

  @Get(':id/logs')
  getLogs(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.bridgeService.getLogs(id, limit ? parseInt(limit) : 50);
  }
}
