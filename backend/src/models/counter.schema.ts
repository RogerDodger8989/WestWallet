import { Schema, model } from 'mongoose';

const counterSchema = new Schema({
  _id: { type: String, required: true }, // t.ex. 'global'
  seq: { type: Number, default: 0 },
});

export default model('Counter', counterSchema);
