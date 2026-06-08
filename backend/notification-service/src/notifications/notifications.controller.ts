import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';

interface EncolarCorreoRequest {
  usuario_id: string;
  tipo: string;
  destinatario: string;
  datos?: Record<string, string>;
}

// Handler gRPC. Otros microservicios llaman a EncolarCorreo para poner un
// correo en la cola. El nombre del servicio/metodo coincide con el .proto.
@Controller()
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @GrpcMethod('NotificationService', 'EncolarCorreo')
  async encolarCorreo(data: EncolarCorreoRequest): Promise<{ id: string; estado: string }> {
    const id = await this.service.encolar(
      data.usuario_id,
      data.tipo,
      data.destinatario,
      data.datos ?? {},
    );
    return { id, estado: 'pendiente' };
  }
}
