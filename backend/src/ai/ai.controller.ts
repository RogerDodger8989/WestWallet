import { Controller, Post, Body } from '@nestjs/common';

@Controller('ai')
export class AiController {
  @Post('categorize')
  async categorize(@Body() data: { text: string; supplier: string; amount: number }) {
    // Dummy-kategorisering, byt ut mot AI/ML-modell vid behov
    let category = 'Övrigt';
    if (data.text?.toLowerCase().includes('el')) category = 'El';
    if (data.supplier?.toLowerCase().includes('ica')) category = 'Mat';
    if (data.amount > 1000) category = 'Större utgift';
    // ...lägg till fler regler eller AI-modell
    return { category };
  }
}
