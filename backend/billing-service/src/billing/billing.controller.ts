import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { BillingService } from './billing.service';

@Controller()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @GrpcMethod('BillingService', 'GetPlans')
  getPlans() {
    return this.billingService.getPlans();
  }

  @GrpcMethod('BillingService', 'CreateSubscription')
  createSubscription(data: {
    usuarioId: string;
    planId: string;
    monto: number;
    moneda: string;
    meses: number;
  }) {
    return this.billingService.createSubscription(data);
  }

  @GrpcMethod('BillingService', 'GetUserSubscription')
  getUserSubscription(data: { usuarioId: string }) {
    return this.billingService.getUserSubscription(data);
  }
  
  @GrpcMethod('BillingService', 'CancelSubscription')
  cancelSubscription(data: { usuarioId: string }) {
    return this.billingService.cancelSubscription(data);
  }

  @GrpcMethod('BillingService', 'ChangeSubscription')
  changeSubscription(data: {
    usuarioId: string;
    nuevoPlanId: string;
    monto: number;
    moneda: string;
    meses: number;
  }) {
    return this.billingService.changeSubscription(data);
  }

  @GrpcMethod('BillingService', 'GetPlanPrice')
  getPlanPrice(data: { planId: string; monedaDestino: string }) {
    return this.billingService.getPlanPrice(data);
  }
}