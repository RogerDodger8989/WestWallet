import { Schema, model } from 'mongoose';

export const billingSchema = new Schema({
  organizationId: { type: String, required: true },
  userId: { type: String, required: true },
  plan: { type: String, required: true }, // free, trial, paid
  status: { type: String, required: true }, // active, grace, cancelled
  trialStart: { type: Date },
  trialEnd: { type: Date },
  paidUntil: { type: Date },
  stripeCustomerId: { type: String },
  stripeSubscriptionId: { type: String },
  invoices: [{
    invoiceId: String,
    amount: Number,
    currency: String,
    paid: Boolean,
    createdAt: Date,
    pdfUrl: String,
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default model('Billing', billingSchema);
