import { Controller, Post, UseGuards, Logger } from '@nestjs/common';
import { InternalSyncGuard } from './internal.guard';
import { SyncService } from '../sync/sync.service';

@Controller('internal')
export class InternalController {
  private readonly logger = new Logger(InternalController.name);

  constructor(private readonly syncService: SyncService) {}

  @Post('sync')
  @UseGuards(InternalSyncGuard)
  async triggerSync() {
    this.logger.log('Internal sync triggered');
    const result = await this.syncService.syncAllEnabled();
    this.logger.log(`Internal sync done: ${JSON.stringify(result)}`);
    return result;
  }
}
