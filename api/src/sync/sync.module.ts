import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { GoogleModule } from '../google/google.module';

@Module({
  imports: [GoogleModule],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
