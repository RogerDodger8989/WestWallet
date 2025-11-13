import { Controller, Post, Body, Get } from '@nestjs/common';

let subscribers: { url: string; event: string }[] = [];
let events: { event: string; payload: any; timestamp: Date }[] = [];

@Controller('webhooks')
export class WebhooksController {
  @Post('subscribe')
  subscribe(@Body() body: { url: string; event: string }) {
    subscribers.push({ url: body.url, event: body.event });
    return { success: true };
  }

  @Post('events')
  addEvent(@Body() body: { event: string; payload: any }) {
    events.push({ event: body.event, payload: body.payload, timestamp: new Date() });
    // Här kan du lägga till kod för att skicka till subscribers
    return { success: true };
  }

  @Get('events')
  getEvents() {
    return events;
  }
}
