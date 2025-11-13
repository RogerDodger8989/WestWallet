import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  async logEvent(@Body() body: any) {
    await this.eventsService.logEvent(body);
    return { success: true };
  }

  @Get()
  async getEvents(
    @Query('model') model?: string,
    @Query('documentId') documentId?: string,
    @Query('type') type?: string,
  ) {
    return this.eventsService.getEvents({ model, documentId, type });
  }
}
