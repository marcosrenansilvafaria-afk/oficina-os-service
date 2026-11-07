import { of } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';
import { httpRequestDuracaoSegundos } from './metrics-registry';

describe('HttpMetricsInterceptor', () => {
  it('observa a duracao da requisicao com method/route/status_code corretos', (done) => {
    const observeSpy = jest.spyOn(httpRequestDuracaoSegundos, 'observe');
    const interceptor = new HttpMetricsInterceptor();

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          route: { path: '/os' },
          url: '/os',
        }),
        getResponse: () => ({ statusCode: 201 }),
      }),
    } as unknown as ExecutionContext;
    const next: CallHandler = { handle: () => of('ok') };

    interceptor.intercept(context, next).subscribe(() => {
      expect(observeSpy).toHaveBeenCalledWith(
        { method: 'POST', route: '/os', status_code: '201' },
        expect.any(Number),
      );
      done();
    });
  });

  it('usa request.url como fallback quando a rota nao tem path definido', (done) => {
    const observeSpy = jest.spyOn(httpRequestDuracaoSegundos, 'observe');
    const interceptor = new HttpMetricsInterceptor();

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', url: '/sem-rota' }),
        getResponse: () => ({ statusCode: 404 }),
      }),
    } as unknown as ExecutionContext;
    const next: CallHandler = { handle: () => of('ok') };

    interceptor.intercept(context, next).subscribe(() => {
      expect(observeSpy).toHaveBeenCalledWith(
        { method: 'GET', route: '/sem-rota', status_code: '404' },
        expect.any(Number),
      );
      done();
    });
  });
});
