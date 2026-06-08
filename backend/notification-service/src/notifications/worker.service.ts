import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

// Worker del patron Outbox: cada 10s procesa los correos pendientes del
// buzon. Desacopla el envio (lento, sujeto a fallos de SMTP) de la
// peticion que lo origino.
@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  constructor(private readonly service: NotificationsService) {}

  @Interval(10000)
  async procesar(): Promise<void> {
    try {
      await this.service.procesarPendientes();
    } catch (err) {
      this.logger.error(`Error en el worker: ${(err as Error).message}`);
    }
  }
}
