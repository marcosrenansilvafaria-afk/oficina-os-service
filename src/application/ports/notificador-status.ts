import {
  OrdemServico,
  StatusOrdemServico,
} from '../../domain/entities/ordem-servico';

/**
 * Porta (Clean Architecture) para notificar mudanças de status da OS.
 * A camada de aplicação depende apenas deste contrato; a infraestrutura
 * fornece a implementação concreta (ex.: e-mail simulado).
 */
export interface NotificadorStatus {
  notificar(
    ordem: OrdemServico,
    statusAnterior: StatusOrdemServico,
  ): Promise<void> | void;
}
