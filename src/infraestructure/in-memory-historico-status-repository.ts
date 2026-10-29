import { StatusOrdemServico } from '../domain/entities/ordem-servico';
import { IHistoricoStatusRepository } from '../domain/repositories/historico-status-repository.interface';

/**
 * Implementacao em memoria - usada por default e pelos testes unitarios,
 * sem dependencia de banco. Nao registra metricas (isso e responsabilidade
 * da implementacao Prisma, usada em runtime real).
 */
export class InMemoryHistoricoStatusRepository implements IHistoricoStatusRepository {
  private eventos: { ordemServicoId: string; status: StatusOrdemServico }[] =
    [];

  registrar(ordemServicoId: string, status: StatusOrdemServico) {
    this.eventos.push({ ordemServicoId, status });
    return Promise.resolve();
  }

  clear() {
    this.eventos = [];
    return Promise.resolve();
  }
}
