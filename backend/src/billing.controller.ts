import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get(':organizationId')
  async getBilling(@Param('organizationId') organizationId: string) {
    return this.billingService.getBillingInfo(organizationId);
  }

  @Post(':organizationId/plan')
  async updatePlan(
    @Param('organizationId') organizationId: string,
    @Body('plan') plan: string
  ) {
    return this.billingService.updatePlan(organizationId, plan);
  }

  @Post(':organizationId/invoice')
  async addInvoice(
    @Param('organizationId') organizationId: string,
    @Body() invoice: any
  ) {
    return this.billingService.addInvoice(organizationId, invoice);
  }

  @Post(':organizationId/stripe')
  async setStripeInfo(
    @Param('organizationId') organizationId: string,
    @Body('stripeCustomerId') stripeCustomerId: string,
    @Body('stripeSubscriptionId') stripeSubscriptionId: string
  ) {
    return this.billingService.setStripeInfo(organizationId, stripeCustomerId, stripeSubscriptionId);
  }
}
