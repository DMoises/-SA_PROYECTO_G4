import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [DatabaseModule, BillingModule],
})
export class AppModule {}
