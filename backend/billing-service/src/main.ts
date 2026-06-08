import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'billing.v1',
        protoPath: join(__dirname, '../proto/billing.proto'),
        url: '0.0.0.0:50052',
      },
    },
  );

  await app.listen();
  console.log('Billing gRPC escuchando en puerto 50052');
}

bootstrap();