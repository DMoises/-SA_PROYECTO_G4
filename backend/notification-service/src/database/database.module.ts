import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

// Global: el DatabaseService queda disponible en toda la app sin
// reimportarlo en cada modulo.
@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
