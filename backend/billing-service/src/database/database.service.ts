import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// Acceso a subscription_db con node-postgres (sin ORM, como exige el
// enunciado). Expone un metodo query tipado. Reemplaza el Pool global que
// antes vivia en database/db.ts y se importaba directo desde el servicio,
// para que las dependencias se inyecten (DIP) en lugar de acoplarse a un
// singleton de modulo. Mismo enfoque que el DatabaseService del
// notification-service.
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.SUBSCRIPTION_DB_HOST ?? 'localhost',
      port: Number(process.env.SUBSCRIPTION_DB_PORT ?? 5434),
      user: process.env.SUBSCRIPTION_DB_USER ?? 'subscription',
      password: process.env.SUBSCRIPTION_DB_PASSWORD ?? 'admin',
      database: process.env.SUBSCRIPTION_DB_NAME ?? 'subscription',
    });
  }

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
