import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { BillingRepository } from './billing.repository';
import { FxClient } from '../fx/fx.client';
import { NotificationClient } from '../notifications/notification.client';

describe('BillingService', () => {
  let service: BillingService;
  let repo: jest.Mocked<BillingRepository>;
  let fxClient: jest.Mocked<FxClient>;
  let notificationClient: jest.Mocked<NotificationClient>;

  beforeEach(async () => {
    const mockBillingRepository = {
      listPlanes: jest.fn(),
      getPlan: jest.fn(),
      procesarRenovacion: jest.fn(),
      getActiveSubscription: jest.fn(),
      cancelActiveSubscription: jest.fn(),
      listPendingRenewals: jest.fn(),
    };

    const mockFxClient = {
      convertirMonto: jest.fn(),
    };

    const mockNotificationClient = {
      encolarRecibo: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: BillingRepository, useValue: mockBillingRepository },
        { provide: FxClient, useValue: mockFxClient },
        { provide: NotificationClient, useValue: mockNotificationClient },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    repo = module.get(BillingRepository);
    fxClient = module.get(FxClient);
    notificationClient = module.get(NotificationClient);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPlans', () => {
    it('debe listar todos los planes con formato adaptado', async () => {
      repo.listPlanes.mockResolvedValue([
        {
          id: 'plan-1',
          nombre_plan: 'Premium',
          precio_base: '10.99',
          moneda_base: 'USD',
        },
      ]);

      const result = await service.getPlans();
      expect(result).toEqual({
        planes: [
          {
            id: 'plan-1',
            nombrePlan: 'Premium',
            precioBase: 10.99,
            monedaBase: 'USD',
          },
        ],
      });
      expect(repo.listPlanes).toHaveBeenCalled();
    });
  });

  describe('createSubscription', () => {
    it('debe retornar mensaje de error si el plan no existe', async () => {
      repo.getPlan.mockResolvedValue(null);

      const result = await service.createSubscription({
        usuarioId: 'usr-1',
        planId: 'plan-invalid',
        monto: 10,
        moneda: 'USD',
        meses: 1,
        correo: 'usr@test.com',
      });

      expect(result).toEqual({
        suscripcionId: '',
        pagoId: '',
        mensaje: 'El plan seleccionado no existe',
      });
    });

    it('debe retornar error si no se pudo procesar la renovacion', async () => {
      repo.getPlan.mockResolvedValue({
        id: 'plan-1',
        nombre_plan: 'Estándar',
        precio_base: '7.99',
        moneda_base: 'USD',
      });
      repo.procesarRenovacion.mockResolvedValue(null);

      const result = await service.createSubscription({
        usuarioId: 'usr-1',
        planId: 'plan-1',
        monto: 7.99,
        moneda: 'USD',
        meses: 1,
        correo: 'usr@test.com',
      });

      expect(result).toEqual({
        suscripcionId: '',
        pagoId: '',
        mensaje: 'No se pudo crear la suscripcion',
      });
    });

    it('debe crear la suscripcion, encolar el recibo y retornar exito', async () => {
      repo.getPlan.mockResolvedValue({
        id: 'plan-1',
        nombre_plan: 'Estándar',
        precio_base: '7.99',
        moneda_base: 'USD',
      });
      repo.procesarRenovacion.mockResolvedValue({
        p_suscripcion_id: 'sub-123',
        p_pago_id: 'pay-456',
      });
      notificationClient.encolarRecibo.mockResolvedValue({ success: true });

      const result = await service.createSubscription({
        usuarioId: 'usr-1',
        planId: 'plan-1',
        monto: 7.99,
        moneda: 'USD',
        meses: 1,
        correo: 'usr@test.com',
      });

      expect(result).toEqual({
        suscripcionId: 'sub-123',
        pagoId: 'pay-456',
        mensaje: 'Suscripcion creada correctamente',
      });
      expect(notificationClient.encolarRecibo).toHaveBeenCalledWith({
        usuarioId: 'usr-1',
        correo: 'usr@test.com',
        plan: 'Estándar',
        monto: 7.99,
        moneda: 'USD',
      });
    });
  });

  describe('getUserSubscription', () => {
    it('debe retornar valores vacios si no hay suscripcion activa', async () => {
      repo.getActiveSubscription.mockResolvedValue(null);

      const result = await service.getUserSubscription({ usuarioId: 'usr-1' });
      expect(result).toEqual({
        suscripcionId: '',
        usuarioId: 'usr-1',
        planId: '',
        nombrePlan: '',
        estadoSuscripcion: '',
        fechaInicio: '',
        fechaFin: '',
      });
    });

    it('debe retornar los datos formateados de la suscripcion activa', async () => {
      repo.getActiveSubscription.mockResolvedValue({
        suscripcion_id: 'sub-1',
        usuario_id: 'usr-1',
        plan_id: 'plan-1',
        nombre_plan: 'Premium',
        estadoSuscripcion: 'activa',
        estado_suscripcion: 'activa',
        fecha_inicio: new Date('2026-01-01T00:00:00.000Z'),
        fecha_fin: new Date('2026-02-01T00:00:00.000Z'),
      });

      const result = await service.getUserSubscription({ usuarioId: 'usr-1' });
      expect(result).toEqual({
        suscripcionId: 'sub-1',
        usuarioId: 'usr-1',
        planId: 'plan-1',
        nombrePlan: 'Premium',
        estadoSuscripcion: 'activa',
        fechaInicio: '2026-01-01',
        fechaFin: '2026-02-01',
      });
    });
  });

  describe('cancelSubscription', () => {
    it('debe retornar mensaje de error si no hay suscripcion activa', async () => {
      repo.cancelActiveSubscription.mockResolvedValue(null);

      const result = await service.cancelSubscription({ usuarioId: 'usr-1' });
      expect(result).toEqual({
        suscripcionId: '',
        mensaje: 'El usuario no tiene una suscripcion activa',
      });
    });

    it('debe retornar el id de la suscripcion cancelada', async () => {
      repo.cancelActiveSubscription.mockResolvedValue('sub-1');

      const result = await service.cancelSubscription({ usuarioId: 'usr-1' });
      expect(result).toEqual({
        suscripcionId: 'sub-1',
        mensaje: 'Suscripcion cancelada correctamente',
      });
    });
  });

  describe('changeSubscription', () => {
    it('debe cambiar de plan y retornar los ids del alta', async () => {
      repo.procesarRenovacion.mockResolvedValue({
        p_suscripcion_id: 'sub-new',
        p_pago_id: 'pay-new',
      });

      const result = await service.changeSubscription({
        usuarioId: 'usr-1',
        nuevoPlanId: 'plan-2',
        monto: 12.99,
        moneda: 'USD',
        meses: 1,
      });

      expect(result).toEqual({
        suscripcionId: 'sub-new',
        pagoId: 'pay-new',
        mensaje: 'Suscripcion cambiada correctamente',
      });
    });
  });

  describe('getPlanPrice', () => {
    it('debe retornar valores vacios si el plan no existe', async () => {
      repo.getPlan.mockResolvedValue(null);

      const result = await service.getPlanPrice({
        planId: 'plan-invalid',
        monedaDestino: 'EUR',
      });

      expect(result).toEqual({
        planId: '',
        nombrePlan: '',
        precioBase: 0,
        monedaBase: '',
        precioConvertido: 0,
        monedaDestino: 'EUR',
      });
    });

    it('debe retornar precio convertido consumiendo el fxClient', async () => {
      repo.getPlan.mockResolvedValue({
        id: 'plan-1',
        nombre_plan: 'Premium',
        precio_base: '10.00',
        moneda_base: 'USD',
      });
      fxClient.convertirMonto.mockResolvedValue({
        montoConvertido: 9.25,
      });

      const result = await service.getPlanPrice({
        planId: 'plan-1',
        monedaDestino: 'EUR',
      });

      expect(result).toEqual({
        planId: 'plan-1',
        nombrePlan: 'Premium',
        precioBase: 10.00,
        monedaBase: 'USD',
        precioConvertido: 9.25,
        monedaDestino: 'EUR',
      });
      expect(fxClient.convertirMonto).toHaveBeenCalledWith(10, 'USD', 'EUR');
    });
  });
});
