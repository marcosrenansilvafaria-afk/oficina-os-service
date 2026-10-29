import { OrdemServico } from '../../domain/entities/ordem-servico';
import { ConsoleEmailNotificador } from './console-email-notificador';

describe('ConsoleEmailNotificador', () => {
  it('deve logar email simulado quando status mudar', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const notificador = new ConsoleEmailNotificador();
    const os = new OrdemServico('os-1', 'cli-1', 'vei-1');

    // OS está em RECEBIDA; statusAnterior diferente → simula transição
    notificador.notificar(os, 'EM_DIAGNOSTICO');

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toContain('[EMAIL SIMULADO]');
    expect(logSpy.mock.calls[0][0]).toContain('os-1');
    logSpy.mockRestore();
  });

  it('nao deve logar quando status nao mudar', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const notificador = new ConsoleEmailNotificador();
    const os = new OrdemServico('os-1');

    notificador.notificar(os, 'RECEBIDA');

    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
