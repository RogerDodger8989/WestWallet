import { Schema } from 'mongoose';

export const RuleSchema = new Schema({
  contains: { type: String, required: true },
  category: { type: String, required: true },
  supplier: { type: String, required: true },
});
