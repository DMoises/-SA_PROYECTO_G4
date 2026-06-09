import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { FxClient } from '../fx/fx.client';

@Module({
  controllers: [BillingController],
  providers: [BillingService, FxClient],
})
export class BillingModule {}