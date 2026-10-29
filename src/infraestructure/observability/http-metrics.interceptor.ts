import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { tap } from 'rxjs/operators';
import { httpRequestDuracaoSegundos } from './metrics-registry';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const start = process.hrtime.bigint();

    return next.handle().pipe(
      tap(() => {
        const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
        const route = (req.route as { path?: string } | undefined)?.path;
        httpRequestDuracaoSegundos.observe(
          {
            method: req.method,
            route: route ?? req.url,
            status_code: String(res.statusCode),
          },
          durationSeconds,
        );
      }),
    );
  }
}
