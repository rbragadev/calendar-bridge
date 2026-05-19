import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CryptoModule } from './crypto/crypto.module';
import { GoogleModule } from './google/google.module';
import { BridgeModule } from './bridge/bridge.module';
import { SyncModule } from './sync/sync.module';
import { InternalModule } from './internal/internal.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CryptoModule,
    GoogleModule,
    BridgeModule,
    SyncModule,
    InternalModule,
  ],
})
export class AppModule {}
