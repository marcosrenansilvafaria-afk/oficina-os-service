import { NotificadorStatus } from '../../application/ports/notificador-status';
import {
  OrdemServico,
  StatusOrdemServico,
} from '../../domain/entities/ordem-servico';

/**
 * Implementação que simula o envio de e-mail ao cliente quando o status da OS muda.
 * No MVP da Fase 2 o "envio" é representado por um log estruturado no console.
 */
export class ConsoleEmailNotificador implements NotificadorStatus {
  notificar(ordem: OrdemServico, statusAnterior: StatusOrdemServico): void {
    const novoStatus = ordem.getStatus();
    if (statusAnterior === novoStatus) return;

    console.log(
      `[EMAIL SIMULADO] OS ${ordem.id} | cliente ${ordem.clienteId ?? 'N/A'} | ` +
        `status: ${statusAnterior} -> ${novoStatus} | enviado em ${new Date().toISOString()}`,
    );
  }
}
