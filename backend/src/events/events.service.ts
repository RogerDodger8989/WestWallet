import { Injectable } from '@nestjs/common';
import Event from './event.schema';

@Injectable()
export class EventsService {
  async logEvent({ type, userId, organizationId, model, documentId, payload }: {
    type: string;
    userId?: string;
    organizationId?: string;
    model: string;
    documentId: string;
    payload?: any;
  }) {
    await Event.create({
      type,
      userId,
      organizationId,
      model,
      documentId,
      payload,
    });
  }

  async getEvents({ model, documentId, type }: { model?: string; documentId?: string; type?: string }) {
    const query: any = {};
    if (model) query.model = model;
    if (documentId) query.documentId = documentId;
    if (type) query.type = type;
    return Event.find(query).sort({ timestamp: -1 }).limit(100).exec();
  }
}
