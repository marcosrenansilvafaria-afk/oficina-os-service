import 'dotenv/config';
import type { Server } from 'node:http';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { PrismaService } from './infraestructure/prisma/prisma.service';
import {
  useDatabaseRepositories,
  seedRepositories,
} from './infraestructure/singletons';

async function bootstrap() {
  const prisma = new PrismaService();
  await prisma.$connect();
  useDatabaseRepositories(prisma);

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Oficina API')
    .setDescription('API para gestao de Ordens de Servico (MVP)')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearer',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  if (process.env.SEED_DATA === 'true') {
    await seedRepositories();
  }

  app.enableShutdownHooks();

  const server = (await app.listen(process.env.PORT ?? 3000)) as Server;
  server.on('close', () => void prisma.$disconnect());
}
bootstrap().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Erro desconhecido ao iniciar API';
  console.error(message);
  process.exit(1);
});
