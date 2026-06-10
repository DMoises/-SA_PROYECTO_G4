import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingRepository } from './billing.repository';
import { FxClient } from '../fx/fx.client';
import { NotificationClient } from '../notifications/notification.client';
import { DatabaseModule } from '../database/database.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RenewalWorker } from './renewal.worker';

@Module({
  imports: [
    DatabaseModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [
    BillingController,
  ],
  providers: [
    BillingService,
    BillingRepository,
    FxClient,
    NotificationClient,
    RenewalWorker,
  ],
})
export class BillingModule {}