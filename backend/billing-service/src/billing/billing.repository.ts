import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

// Filas tal como las devuelve subscription_db. El repositorio aisla el SQL
// crudo del servicio: antes BillingService ejecutaba estas consultas en linea,
// mezclando acceso a datos con logica de negocio (violacion de SRP).
export interface PlanRow {
  id: string;
  nombre_plan: string;
  precio_base: string;
  moneda_base: string;
}

export interface SubscriptionRow {
  suscripcion_id: string;
  usuario_id: string;
  plan_id: string;
  nombre_plan: string;
  estado_suscripcion: string;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
}

// sp_ProcesarRenovacion devuelve los parametros INOUT en la fila del CALL.
export interface RenovacionRow {
  p_suscripcion_id: string;
  p_pago_id: string;
}

export interface PendingRenewalRow {
  suscripcion_id: string;
  usuario_id: string;
  plan_id: string;
  nombre_plan: string;
  precio_base: string;
  moneda_base: string;
  fecha_fin: Date;
}

@Injectable()
export class BillingRepository {
  constructor(private readonly db: DatabaseService) {}

  async listPlanes(): Promise<PlanRow[]> {
    const res = await this.db.query<PlanRow>(
      `SELECT id, nombre_plan, precio_base, moneda_base
       FROM planes
       ORDER BY precio_base ASC`,
    );
    return res.rows;
  }

  async getPlan(planId: string): Promise<PlanRow | null> {
    const res = await this.db.query<PlanRow>(
      `SELECT id, nombre_plan, precio_base, moneda_base
       FROM planes
       WHERE id = $1`,
      [planId],
    );
    return res.rows[0] ?? null;
  }

  // sp_ProcesarRenovacion: crea o renueva la suscripcion y registra el pago.
  // La usan tanto el alta como el cambio de plan.
  async procesarRenovacion(
    usuarioId: string,
    planId: string,
    monto: number,
    moneda: string,
    meses: number,
  ): Promise<RenovacionRow | null> {
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.current_user', $1, true)", [usuarioId]);
      const res = await client.query<RenovacionRow>(
        `CALL sp_ProcesarRenovacion(
           $1::uuid, $2::uuid, $3::numeric, $4::char(3), $5::integer, NULL, NULL
         )`,
        [usuarioId, planId, monto, moneda, meses],
      );
      await client.query('COMMIT');
      return res.rows[0] ?? null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getActiveSubscription(usuarioId: string): Promise<SubscriptionRow | null> {
    const res = await this.db.query<SubscriptionRow>(
      `SELECT
         s.id AS suscripcion_id,
         s.usuario_id,
         s.plan_id,
         p.nombre_plan,
         s.estado_suscripcion,
         s.fecha_inicio,
         s.fecha_fin
       FROM suscripciones s
       INNER JOIN planes p ON p.id = s.plan_id
       WHERE s.usuario_id = $1
         AND s.estado_suscripcion = 'activa'
       LIMIT 1`,
      [usuarioId],
    );
    return res.rows[0] ?? null;
  }

  // Cancela la suscripcion activa y devuelve su id (o null si no existia).
  async cancelActiveSubscription(usuarioId: string): Promise<string | null> {
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      await client.query("SELECT set_config('app.current_user', $1, true)", [usuarioId]);
      const res = await client.query<{ id: string }>(
        `UPDATE suscripciones
         SET estado_suscripcion = 'cancelada',
             fecha_fin = CURRENT_DATE
         WHERE usuario_id = $1
           AND estado_suscripcion = 'activa'
         RETURNING id`,
        [usuarioId],
      );
      await client.query('COMMIT');
      return res.rows[0]?.id ?? null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async listPendingRenewals(): Promise<PendingRenewalRow[]> {
    const result = await this.db.query<PendingRenewalRow>(
      `SELECT
        s.id AS suscripcion_id,
        s.usuario_id,
        s.plan_id,
        p.nombre_plan,
        p.precio_base,
        p.moneda_base,
        s.fecha_fin
      FROM suscripciones s
      INNER JOIN planes p ON p.id = s.plan_id
      WHERE s.estado_suscripcion = 'activa'
        AND s.fecha_fin IS NOT NULL
        AND s.fecha_fin <= CURRENT_DATE
      ORDER BY s.fecha_fin ASC`,
    );

    return result.rows;
  }
}
