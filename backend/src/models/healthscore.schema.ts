import { Schema, model } from 'mongoose';

export const healthScoreSchema = new Schema({
  organizationId: { type: String, required: true },
  score: { type: Number, required: true },
  tips: [{ type: String }],
  spargrad: { type: Number },
  fastaKostnader: { type: Number },
  inkomst: { type: Number },
  skuldniva: { type: Number },
  volatilitet: { type: Number },
  updatedAt: { type: Date, default: Date.now },
});

export default model('HealthScore', healthScoreSchema);
