import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { integracaoErrosTotal } from './metrics-registry';

function buildHost(request: object) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('AllExceptionsFilter', () => {
  const logger = { setContext: jest.fn(), error: jest.fn(), warn: jest.fn() };
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    jest.clearAllMocks();
    filter = new AllExceptionsFilter(logger as never);
    integracaoErrosTotal.reset();
  });

  it('responde com o status da HttpException e loga como warn (status < 500)', () => {
    const { host, status, json } = buildHost({
      url: '/os/invalido',
      route: { path: '/os/:id' },
    });
    const exception = new HttpException(
      'OS nao encontrada',
      HttpStatus.NOT_FOUND,
    );

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'OS nao encontrada',
    });
    expect(logger.warn).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('trata excecao desconhecida como 500, loga erro e incrementa a metrica', () => {
    const { host, status, json } = buildHost({
      url: '/os',
      route: { path: '/os' },
    });

    filter.catch(new Error('falha inesperada'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Erro interno do servidor',
    });
    expect(logger.error).toHaveBeenCalled();
  });

  it('usa request.url quando a rota nao tem path definido', () => {
    const { host } = buildHost({ url: '/rota-sem-match' });

    filter.catch(new Error('x'), host);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/rota-sem-match' }),
      'Erro nao tratado',
    );
  });
});
