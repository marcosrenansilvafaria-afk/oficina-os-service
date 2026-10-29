import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TerminusModule } from '@nestjs/terminus';
import { join } from 'path';
import { OrdemServicoController } from './interfaces/http/ordem-servico.controller';
import { ClienteController } from './interfaces/http/cliente.controller';
import { VeiculoController } from './interfaces/http/veiculo.controller';
import { ServicoController } from './interfaces/http/servico.controller';
import { PecaController } from './interfaces/http/peca.controller';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from './infraestructure/observability/logger.module';
import { MetricsController } from './infraestructure/observability/metrics.controller';
import { HealthController } from './infraestructure/observability/health.controller';
import { HttpMetricsInterceptor } from './infraestructure/observability/http-metrics.interceptor';
import { AllExceptionsFilter } from './infraestructure/observability/all-exceptions.filter';
import { PrismaService } from './infraestructure/prisma/prisma.service';
import { SagaModule } from './infraestructure/saga/saga.module';

@Module({
  imports: [
    LoggerModule,
    AuthModule,
    TerminusModule,
    SagaModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
  ],
  controllers: [
    OrdemServicoController,
    ClienteController,
    VeiculoController,
    ServicoController,
    PecaController,
    MetricsController,
    HealthController,
  ],
  providers: [
    PrismaService,
    { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
