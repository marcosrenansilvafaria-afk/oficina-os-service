import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import type { IncomingMessage, ServerResponse } from 'node:http';

const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Logs estruturados em JSON (via pino) com correlation-id de requisicao:
 * reaproveita o header x-correlation-id se o cliente enviar, senao gera um
 * novo (UUID) e o devolve na resposta - permite rastrear uma requisicao
 * ponta a ponta entre este app e outros servicos (ex: Lambda de autenticacao).
 */
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req: IncomingMessage, res: ServerResponse) => {
          const existing = req.headers[CORRELATION_ID_HEADER];
          const correlationId = Array.isArray(existing)
            ? existing[0]
            : (existing ?? randomUUID());
          res.setHeader(CORRELATION_ID_HEADER, correlationId);
          return correlationId;
        },
        customProps: (req: IncomingMessage) => ({
          correlationId: (req as { id?: string }).id,
        }),
        redact: ['req.headers.authorization'],
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty' }
            : undefined,
      },
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
