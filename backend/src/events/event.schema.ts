import { Schema, model, Document } from 'mongoose';



export const EventSchema = new Schema({
  timestamp: { type: Date, default: Date.now },
  type: { type: String, required: true }, // t.ex. PostCreated, FileUploaded
  userId: { type: String },
  organizationId: { type: String },
  model: { type: String, required: true },
  documentId: { type: String, required: true },
  payload: { type: Schema.Types.Mixed },
});

export default model('Event', EventSchema);
