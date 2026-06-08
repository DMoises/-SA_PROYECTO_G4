import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // habilita el worker (@Interval)
    DatabaseModule,
    NotificationsModule,
  ],
})
export class AppModule {}
