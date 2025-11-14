import { Injectable } from '@nestjs/common';
import Billing from './models/billing.schema';

@Injectable()
export class BillingService {
  async getBillingInfo(organizationId: string) {
    return Billing.findOne({ organizationId }).lean();
  }

  async updatePlan(organizationId: string, plan: string) {
    return Billing.findOneAndUpdate({ organizationId }, { plan, updatedAt: new Date() }, { new: true });
  }

  async addInvoice(organizationId: string, invoice: any) {
    return Billing.findOneAndUpdate(
      { organizationId },
      { $push: { invoices: invoice }, updatedAt: new Date() },
      { new: true }
    );
  }

  async setStripeInfo(organizationId: string, stripeCustomerId: string, stripeSubscriptionId: string) {
    return Billing.findOneAndUpdate(
      { organizationId },
      { stripeCustomerId, stripeSubscriptionId, updatedAt: new Date() },
      { new: true }
    );
  }
}
