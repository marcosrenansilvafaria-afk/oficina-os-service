import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { integracaoErrosTotal } from './metrics-registry';

/**
 * Filtro global: loga toda excecao nao tratada em JSON (com correlation-id,
 * via nestjs-pino) e incrementa a metrica de erros para respostas 5xx -
 * usada no dashboard de "taxa de erros e falhas em integracoes".
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Erro interno do servidor';

    if (status >= 500) {
      const route = (request.route as { path?: string } | undefined)?.path;
      integracaoErrosTotal.inc({
        integracao: route ?? request.url,
      });
      this.logger.error(
        { err: exception, path: request.url },
        'Erro nao tratado',
      );
    } else {
      this.logger.warn({ path: request.url, status }, 'Requisicao invalida');
    }

    response
      .status(status)
      .json(
        typeof message === 'string'
          ? { statusCode: status, message }
          : { statusCode: status, ...message },
      );
  }
}
