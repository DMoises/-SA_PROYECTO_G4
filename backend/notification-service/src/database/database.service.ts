import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// Acceso a notification_db con node-postgres (sin ORM, como exige el
// enunciado). Expone un metodo query tipado.
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.NOTIFICATION_DB_HOST ?? 'notification-db',
      port: Number(process.env.NOTIFICATION_DB_PORT_INTERNAL ?? 5432),
      database: process.env.NOTIFICATION_DB_NAME ?? 'notification_db',
      user: process.env.NOTIFICATION_DB_USER ?? 'notification_user',
      password: process.env.NOTIFICATION_DB_PASSWORD ?? '',
    });
  }

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  // Conexion dedicada para transacciones (BEGIN/COMMIT). Se usa cuando hay que
  // setear app.current_user con SET LOCAL en la misma transaccion de la
  // escritura, igual que el DatabaseService del billing-service.
  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
