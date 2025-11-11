import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Tillåt CORS för frontend
  app.enableCors();

  // Konfigurera Swagger
  const config = new DocumentBuilder()
    .setTitle('WestWallet API')
    .setDescription(
      'API-dokumentation för autentisering, användare och roller i WestWallet',
    )
    .setVersion('1.0')
    .addBearerAuth() // Lägger till JWT-auth i Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // behåll token efter refresh
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Server körs på http://localhost:${port}`);
  console.log(`📘 Swagger-dokumentation: http://localhost:${port}/api`);
}

bootstrap();
