import { Injectable, OnModuleInit } from '@nestjs/common';
import { credentials, loadPackageDefinition, Client } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { join } from 'path';

@Injectable()
export class FxClient implements OnModuleInit {
  private client: any;

  onModuleInit() {
    const protoPath = join(process.cwd(), 'proto/fx.proto');

    const packageDefinition = loadSync(protoPath, {
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const proto: any = loadPackageDefinition(packageDefinition);
    const FXService = proto.fx.v1.FXService;

    this.client = new FXService(
      process.env.FX_SERVICE_ADDR || 'localhost:50053',
      credentials.createInsecure(),
    );
  }

  convertirMonto(monto: number, origen: string, destino: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.ConvertirMonto(
        {
          monto,
          monedaOrigen: origen,
          monedaDestino: destino,
        },
        (error: any, response: any) => {
          if (error) return reject(error);
          resolve(response);
        },
      );
    });
  }
}