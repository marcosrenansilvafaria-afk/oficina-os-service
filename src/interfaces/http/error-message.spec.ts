import { getErrorMessage } from './error-message';

describe('getErrorMessage', () => {
  it('deve retornar mensagem de Error', () => {
    expect(getErrorMessage(new Error('falha'))).toBe('falha');
  });

  it('deve retornar string direta', () => {
    expect(getErrorMessage('erro simples')).toBe('erro simples');
  });

  it('deve retornar fallback para valor desconhecido', () => {
    expect(getErrorMessage({})).toBe('Erro desconhecido');
  });
});
