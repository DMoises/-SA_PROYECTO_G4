import { Injectable } from '@nestjs/common';
import { db } from '../database/db';
import { FxClient } from '../fx/fx.client';

@Injectable()
export class BillingService {
  constructor(private readonly fxClient: FxClient) {}

  async getPlans() {
    const result = await db.query(`
      SELECT id, nombre_plan, precio_base, moneda_base
      FROM planes
      ORDER BY precio_base ASC
    `);

    return {
      planes: result.rows.map((plan) => ({
        id: plan.id,
        nombrePlan: plan.nombre_plan,
        precioBase: Number(plan.precio_base),
        monedaBase: plan.moneda_base,
      })),
    };
  }

  async createSubscription(data: {
    usuarioId: string;
    planId: string;
    monto: number;
    moneda: string;
    meses: number;
  }) {
    const result = await db.query(
      `
      CALL sp_ProcesarRenovacion(
        $1::uuid,
        $2::uuid,
        $3::numeric,
        $4::char(3),
        $5::integer,
        NULL,
        NULL
      )
      `,
      [
        data.usuarioId,
        data.planId,
        data.monto,
        data.moneda,
        data.meses || 1,
      ],
    );

    return {
      suscripcionId: result.rows[0]?.p_suscripcion_id ?? '',
      pagoId: result.rows[0]?.p_pago_id ?? '',
      mensaje: 'Suscripcion creada correctamente',
    };
  }

  async getUserSubscription(data: { usuarioId: string }) {
    const result = await db.query(
      `
      SELECT
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
      LIMIT 1
      `,
      [data.usuarioId],
    );

    if (result.rows.length === 0) {
      return {
        suscripcionId: '',
        usuarioId: data.usuarioId,
        planId: '',
        nombrePlan: '',
        estadoSuscripcion: '',
        fechaInicio: '',
        fechaFin: '',
      };
    }

    const row = result.rows[0];

    return {
      suscripcionId: row.suscripcion_id,
      usuarioId: row.usuario_id,
      planId: row.plan_id,
      nombrePlan: row.nombre_plan,
      estadoSuscripcion: row.estado_suscripcion,
      fechaInicio: row.fecha_inicio?.toISOString?.().split('T')[0] ?? '',
      fechaFin: row.fecha_fin?.toISOString?.().split('T')[0] ?? '',
    };
  }

  async cancelSubscription(data: { usuarioId: string }) {
    const result = await db.query(
      `
      UPDATE suscripciones
      SET estado_suscripcion = 'cancelada',
          fecha_fin = CURRENT_DATE
      WHERE usuario_id = $1
        AND estado_suscripcion = 'activa'
      RETURNING id
      `,
      [data.usuarioId],
    );

    if (result.rows.length === 0) {
      return {
        suscripcionId: '',
        mensaje: 'El usuario no tiene una suscripcion activa',
      };
    }

    return {
      suscripcionId: result.rows[0].id,
      mensaje: 'Suscripcion cancelada correctamente',
    };
  }

  async changeSubscription(data: {
    usuarioId: string;
    nuevoPlanId: string;
    monto: number;
    moneda: string;
    meses: number;
  }) {
    const result = await db.query(
      `
      CALL sp_ProcesarRenovacion(
        $1::uuid,
        $2::uuid,
        $3::numeric,
        $4::char(3),
        $5::integer,
        NULL,
        NULL
      )
      `,
      [
        data.usuarioId,
        data.nuevoPlanId,
        data.monto,
        data.moneda,
        data.meses || 1,
      ],
    );

    return {
      suscripcionId: result.rows[0]?.p_suscripcion_id ?? '',
      pagoId: result.rows[0]?.p_pago_id ?? '',
      mensaje: 'Suscripcion cambiada correctamente',
    };
  }

  async getPlanPrice(data: { planId: string; monedaDestino: string }) {
    const result = await db.query(
      `
      SELECT id, nombre_plan, precio_base, moneda_base
      FROM planes
      WHERE id = $1
      `,
      [data.planId],
    );

    if (result.rows.length === 0) {
      return {
        planId: '',
        nombrePlan: '',
        precioBase: 0,
        monedaBase: '',
        precioConvertido: 0,
        monedaDestino: data.monedaDestino,
      };
    }

    const plan = result.rows[0];

    const fx = await this.fxClient.convertirMonto(
      Number(plan.precio_base),
      plan.moneda_base,
      data.monedaDestino,
    );

    return {
      planId: plan.id,
      nombrePlan: plan.nombre_plan,
      precioBase: Number(plan.precio_base),
      monedaBase: plan.moneda_base,
      precioConvertido: Number(fx.montoConvertido),
      monedaDestino: data.monedaDestino,
    };
  }
}