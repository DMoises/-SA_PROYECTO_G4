import { config } from 'dotenv';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

// Carga el .env de la raiz del repo antes de instanciar el DatabaseService
// (la inyeccion lee process.env). Antes esta carga vivia en database/db.ts.
config({ path: join(process.cwd(), '../../.env') });

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'billing.v1',
        protoPath: join(process.cwd(), 'proto/billing.proto'),
        url: '0.0.0.0:50052',
      },
    },
  );

  await app.listen();
  console.log('Billing gRPC escuchando en puerto 50052');
}

bootstrap();