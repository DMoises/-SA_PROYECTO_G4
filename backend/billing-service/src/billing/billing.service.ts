import {
  Injectable,
  Logger,
} from '@nestjs/common'
import { BillingRepository } from './billing.repository'
import { FxClient } from '../fx/fx.client'
import { NotificationClient } from '../notifications/notification.client'

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name)

  constructor(
    private readonly repo: BillingRepository,
    private readonly fxClient: FxClient,
    private readonly notificationClient: NotificationClient
  ) {}

  async getPlans() {
    const planes = await this.repo.listPlanes()

    return {
      planes: planes.map(plan => ({
        id: plan.id,
        nombrePlan: plan.nombre_plan,
        precioBase: Number(plan.precio_base),
        monedaBase: plan.moneda_base,
      })),
    }
  }

  async createSubscription(data: {
    usuarioId: string;
    planId: string;
    monto: number;
    moneda: string;
    meses: number;
    correo: string;
  }) {
    const plan = await this.repo.getPlan(data.planId);

    if (!plan) {
      return {
        suscripcionId: '',
        pagoId: '',
        mensaje: 'El plan seleccionado no existe',
      };
    }

    const row = await this.repo.procesarRenovacion(
      data.usuarioId,
      data.planId,
      data.monto,
      data.moneda,
      data.meses || 1,
    );

    if (!row?.p_suscripcion_id) {
      return {
        suscripcionId: '',
        pagoId: '',
        mensaje: 'No se pudo crear la suscripcion',
      };
    }

    try {
      await this.notificationClient.encolarRecibo({
        usuarioId: data.usuarioId,
        correo: data.correo,
        plan: plan.nombre_plan,
        monto: data.monto,
        moneda: data.moneda,
      });

      console.log(
        `Recibo encolado para ${data.correo}`,
      );
    } catch (error) {
      console.error(
        'La suscripcion fue creada, pero no se pudo encolar el correo:',
        error,
      );
    }

    return {
      suscripcionId: row.p_suscripcion_id,
      pagoId: row.p_pago_id,
      mensaje: 'Suscripcion creada correctamente',
    };
  }

  async getUserSubscription(data: {
    usuarioId: string
  }) {
    const row = await this.repo.getActiveSubscription(
      data.usuarioId
    )

    if (!row) {
      return {
        suscripcionId: '',
        usuarioId: data.usuarioId,
        planId: '',
        nombrePlan: '',
        estadoSuscripcion: '',
        fechaInicio: '',
        fechaFin: '',
      }
    }

    return {
      suscripcionId: row.suscripcion_id,
      usuarioId: row.usuario_id,
      planId: row.plan_id,
      nombrePlan: row.nombre_plan,
      estadoSuscripcion: row.estado_suscripcion,
      fechaInicio: formatDate(row.fecha_inicio),
      fechaFin: formatDate(row.fecha_fin),
    }
  }

  async cancelSubscription(data: {
    usuarioId: string
  }) {
    const id = await this.repo.cancelActiveSubscription(
      data.usuarioId
    )

    if (!id) {
      return {
        suscripcionId: '',
        mensaje: 'El usuario no tiene una suscripcion activa',
      }
    }

    return {
      suscripcionId: id,
      mensaje: 'Suscripcion cancelada correctamente',
    }
  }

  async changeSubscription(data: {
    usuarioId: string
    nuevoPlanId: string
    monto: number
    moneda: string
    meses: number
  }) {
    const row = await this.repo.procesarRenovacion(
      data.usuarioId,
      data.nuevoPlanId,
      data.monto,
      data.moneda,
      data.meses || 1
    )

    return {
      suscripcionId: row?.p_suscripcion_id ?? '',
      pagoId: row?.p_pago_id ?? '',
      mensaje: 'Suscripcion cambiada correctamente',
    }
  }

  async getPlanPrice(data: {
    planId: string
    monedaDestino: string
  }) {
    const plan = await this.repo.getPlan(data.planId)

    if (!plan) {
      return {
        planId: '',
        nombrePlan: '',
        precioBase: 0,
        monedaBase: '',
        precioConvertido: 0,
        monedaDestino: data.monedaDestino,
      }
    }

    const fx = await this.fxClient.convertirMonto(
      Number(plan.precio_base),
      plan.moneda_base,
      data.monedaDestino
    )

    return {
      planId: plan.id,
      nombrePlan: plan.nombre_plan,
      precioBase: Number(plan.precio_base),
      monedaBase: plan.moneda_base,
      precioConvertido: Number(fx.montoConvertido),
      monedaDestino: data.monedaDestino,
    }
  }
}

function formatDate(value: Date | null): string {
  return value?.toISOString?.().split('T')[0] ?? ''
}