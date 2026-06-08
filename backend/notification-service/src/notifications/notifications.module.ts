import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { MailerService } from './mailer.service';
import { WorkerService } from './worker.service';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    MailerService,
    WorkerService,
  ],
})
export class NotificationsModule {}
