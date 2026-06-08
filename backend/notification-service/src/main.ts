import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'notification.v1',
      protoPath: join(__dirname, '..', 'proto', 'notification.proto'),
      url: process.env.GRPC_URL ?? '0.0.0.0:50054',
      // keepCase: conserva los nombres snake_case del .proto en los objetos JS
      loader: { keepCase: true },
    },
  });

  await app.listen();
  // eslint-disable-next-line no-console
  console.log(
    `notification-service escuchando gRPC en ${process.env.GRPC_URL ?? '0.0.0.0:50054'}`,
  );
}

void bootstrap();
