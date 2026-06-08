import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResult, QueryResultRow } from 'pg';

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

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
