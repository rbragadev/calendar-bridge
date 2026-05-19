import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { SyncModule } from '../sync/sync.module';

@Module({
  imports: [SyncModule],
  controllers: [InternalController],
})
export class InternalModule {}
