import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { BillingRepository } from './billing.repository';
import { FxClient } from '../fx/fx.client';

@Module({
  controllers: [BillingController],
  providers: [BillingService, BillingRepository, FxClient],
})
export class BillingModule {}
