import { IOrdemRepository } from '../../domain/repositories/ordem-repository.interface';
import { NotificadorStatus } from '../ports/notificador-status';

export type OrigemFalhaCompensacao = 'PAGAMENTO' | 'EXECUCAO';

/**
 * Reage ao CompensarOSEvent do Saga (ver SAGA_PATTERN_SPEC.md no
 * oficina-app). origemFalha=PAGAMENTO reaproveita a mesma transicao de
 * recusarOrcamento() (reabre para novo diagnostico); origemFalha=EXECUCAO
 * usa compensarExecucao() (estado terminal CANCELADA - o reparo ja estava
 * em andamento, nao ha como reabrir um novo ciclo de orcamento).
 */
export class CompensarOrdemServico {
  constructor(
    private repo: IOrdemRepository,
    private notificador?: NotificadorStatus,
  ) {}

  async execute(id: string, origemFalha: OrigemFalhaCompensacao) {
    const os = await this.repo.getById(id);
    if (!os) throw new Error('OS não encontrada');

    const statusAnterior = os.getStatus();

    if (origemFalha === 'PAGAMENTO') {
      os.recusarOrcamento();
    } else {
      os.compensarExecucao();
    }

    await this.repo.save(os);
    await this.notificador?.notificar(os, statusAnterior);
    return os;
  }
}
