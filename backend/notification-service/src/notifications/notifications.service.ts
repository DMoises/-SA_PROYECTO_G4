import { Injectable, Logger } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { MailerService } from './mailer.service';
import { renderPlantilla } from './templates';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly repo: NotificationsRepository,
    private readonly mailer: MailerService,
  ) {}

  // Encola un correo. El destinatario y los datos de render se guardan
  // juntos en el payload JSON de buzon_salida.
  async encolar(
    usuarioId: string,
    tipo: string,
    destinatario: string,
    datos: Record<string, string>,
  ): Promise<string> {
    const payload = { email: destinatario, ...datos };
    const id = await this.repo.encolar(usuarioId, tipo, payload);
    this.logger.log(`Correo encolado id=${id} tipo=${tipo}`);
    return id;
  }

  // Procesa un lote de pendientes: renderiza, envia y marca el resultado.
  // Lo invoca el worker periodicamente.
  async procesarPendientes(limite = 20): Promise<void> {
    const pendientes = await this.repo.obtenerPendientes(limite);
    for (const n of pendientes) {
      const datos = n.payload ?? {};
      const to = datos.email;
      if (!to) {
        await this.repo.marcarFallido(n.id, n.usuario_id);
        this.logger.warn(`Correo ${n.id} sin destinatario; marcado fallido`);
        continue;
      }
      const { subject, html } = renderPlantilla(n.tipo, datos);
      try {
        await this.mailer.enviar(to, subject, html);
        await this.repo.marcarEnviado(n.id, n.usuario_id);
        this.logger.log(`Correo ${n.id} enviado a ${to}`);
      } catch (err) {
        await this.repo.marcarFallido(n.id, n.usuario_id);
        this.logger.error(`Fallo al enviar ${n.id}: ${(err as Error).message}`);
      }
    }
  }
}
