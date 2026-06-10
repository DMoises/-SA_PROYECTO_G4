import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BillingRepository } from './billing.repository';

@Injectable()
export class RenewalWorker {
  private readonly logger = new Logger(RenewalWorker.name);
  private processing = false;

  constructor(
    private readonly repo: BillingRepository,
  ) {}

  @Cron('0 0 2 * * *', {
    timeZone: 'America/Guatemala',
  })
  async processPendingRenewals(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      const pending = await this.repo.listPendingRenewals();

      this.logger.log(
        `Suscripciones pendientes de renovación: ${pending.length}`,
      );

      for (const subscription of pending) {
        try {
          const renewal = await this.repo.procesarRenovacion(
            subscription.usuario_id,
            subscription.plan_id,
            Number(subscription.precio_base),
            subscription.moneda_base,
            1,
          );

          if (!renewal?.p_pago_id) {
            this.logger.error(
              `No se generó el pago para la suscripción ${subscription.suscripcion_id}`,
            );
            continue;
          }

          this.logger.log(
            `Suscripción renovada correctamente: ${subscription.suscripcion_id}`,
          );
        } catch (error) {
          this.logger.error(
            `Error renovando ${subscription.suscripcion_id}: ${
              error instanceof Error
                ? error.message
                : 'error desconocido'
            }`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `No se pudieron consultar las renovaciones: ${
          error instanceof Error
            ? error.message
            : 'error desconocido'
        }`,
      );
    } finally {
      this.processing = false;
    }
  }
}