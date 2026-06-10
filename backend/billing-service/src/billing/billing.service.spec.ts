import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { BillingRepository } from './billing.repository';
import { FxClient } from '../fx/fx.client';

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        // Dobles de las dependencias inyectadas: ahora el servicio se puede
        // construir sin DB ni gRPC reales (gracias a la inversion de deps).
        { provide: BillingRepository, useValue: {} },
        { provide: FxClient, useValue: {} },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
