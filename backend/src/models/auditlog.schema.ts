import { Schema, model } from 'mongoose';

const auditLogSchema = new Schema({
  timestamp: { type: Date, default: Date.now },
  userId: { type: String, required: false },
  action: { type: String, required: true }, // create, update, delete, etc.
  model: { type: String, required: true }, // t.ex. 'Expense', 'User'
  documentId: { type: String, required: true },
  changes: { type: Object, required: false }, // diff eller hela objektet
  ip: { type: String, required: false },
});

export default model('AuditLog', auditLogSchema);
