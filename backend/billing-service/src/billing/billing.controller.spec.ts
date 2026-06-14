import { Test, TestingModule } from '@nestjs/testing';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

describe('BillingController', () => {
  let controller: BillingController;
  let service: jest.Mocked<BillingService>;

  beforeEach(async () => {
    const mockBillingService = {
      getPlans: jest.fn(),
      createSubscription: jest.fn(),
      getUserSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
      changeSubscription: jest.fn(),
      getPlanPrice: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [{ provide: BillingService, useValue: mockBillingService }],
    }).compile();

    controller = module.get<BillingController>(BillingController);
    service = module.get(BillingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPlans', () => {
    it('debe llamar a service.getPlans', async () => {
      service.getPlans.mockResolvedValue({ planes: [] });
      const res = await controller.getPlans();
      expect(res).toEqual({ planes: [] });
      expect(service.getPlans).toHaveBeenCalled();
    });
  });

  describe('createSubscription', () => {
    it('debe llamar a service.createSubscription', async () => {
      const data = {
        usuarioId: 'usr-1',
        planId: 'plan-1',
        monto: 10,
        moneda: 'USD',
        meses: 1,
        correo: 'test@test.com',
      };
      const expected = { suscripcionId: 'sub-1', pagoId: 'pay-1', mensaje: 'Ok' };
      service.createSubscription.mockResolvedValue(expected);

      const res = await controller.createSubscription(data);
      expect(res).toEqual(expected);
      expect(service.createSubscription).toHaveBeenCalledWith(data);
    });
  });

  describe('getUserSubscription', () => {
    it('debe llamar a service.getUserSubscription', async () => {
      const data = { usuarioId: 'usr-1' };
      const expected = {
        suscripcionId: 'sub-1',
        usuarioId: 'usr-1',
        planId: 'plan-1',
        nombrePlan: 'Premium',
        estadoSuscripcion: 'activa',
        fechaInicio: '2026-01-01',
        fechaFin: '2026-02-01',
      };
      service.getUserSubscription.mockResolvedValue(expected);

      const res = await controller.getUserSubscription(data);
      expect(res).toEqual(expected);
      expect(service.getUserSubscription).toHaveBeenCalledWith(data);
    });
  });

  describe('cancelSubscription', () => {
    it('debe llamar a service.cancelSubscription', async () => {
      const data = { usuarioId: 'usr-1' };
      const expected = { suscripcionId: 'sub-1', mensaje: 'Cancelado' };
      service.cancelSubscription.mockResolvedValue(expected);

      const res = await controller.cancelSubscription(data);
      expect(res).toEqual(expected);
      expect(service.cancelSubscription).toHaveBeenCalledWith(data);
    });
  });

  describe('changeSubscription', () => {
    it('debe llamar a service.changeSubscription', async () => {
      const data = {
        usuarioId: 'usr-1',
        nuevoPlanId: 'plan-2',
        monto: 15,
        moneda: 'USD',
        meses: 1,
      };
      const expected = { suscripcionId: 'sub-2', pagoId: 'pay-2', mensaje: 'Cambiado' };
      service.changeSubscription.mockResolvedValue(expected);

      const res = await controller.changeSubscription(data);
      expect(res).toEqual(expected);
      expect(service.changeSubscription).toHaveBeenCalledWith(data);
    });
  });

  describe('getPlanPrice', () => {
    it('debe llamar a service.getPlanPrice', async () => {
      const data = { planId: 'plan-1', monedaDestino: 'EUR' };
      const expected = {
        planId: 'plan-1',
        nombrePlan: 'Premium',
        precioBase: 10,
        monedaBase: 'USD',
        precioConvertido: 9,
        monedaDestino: 'EUR',
      };
      service.getPlanPrice.mockResolvedValue(expected);

      const res = await controller.getPlanPrice(data);
      expect(res).toEqual(expected);
      expect(service.getPlanPrice).toHaveBeenCalledWith(data);
    });
  });
});
