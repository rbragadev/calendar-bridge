import { Module } from '@nestjs/common';
import { BridgeService } from './bridge.service';
import { BridgeController } from './bridge.controller';
import { SyncModule } from '../sync/sync.module';

@Module({
  imports: [SyncModule],
  providers: [BridgeService],
  controllers: [BridgeController],
  exports: [BridgeService],
})
export class BridgeModule {}
