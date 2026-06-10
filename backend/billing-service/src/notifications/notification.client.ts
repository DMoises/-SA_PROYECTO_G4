import { Injectable, OnModuleInit } from '@nestjs/common';
import { credentials, loadPackageDefinition } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { join } from 'path';

interface EncolarReciboData {
  usuarioId: string;
  correo: string;
  plan: string;
  monto: number;
  moneda: string;
}

@Injectable()
export class NotificationClient implements OnModuleInit {
  private client: any;

  onModuleInit() {
    const protoPath = join(
      process.cwd(),
      'proto/notifications.proto',
    );

    const packageDefinition = loadSync(protoPath, {
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const proto: any = loadPackageDefinition(packageDefinition);

    const NotificationService =
      proto.notification.v1.NotificationService;

    this.client = new NotificationService(
      process.env.NOTIFICATION_SERVICE_ADDR ||
        'localhost:50054',
      credentials.createInsecure(),
    );
  }

  encolarRecibo(data: EncolarReciboData): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.EncolarCorreo(
        {
          usuarioId: data.usuarioId,
          tipo: 'recibo',
          destinatario: data.correo,
          datos: {
            plan: data.plan,
            monto: data.monto.toFixed(2),
            moneda: data.moneda,
          },
        },
        (error: any, response: any) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(response);
        },
      );
    });
  }
}