import { IOrdemRepository } from '../../domain/repositories/ordem-repository.interface';
import { StatusOrdemServico } from '../../domain/entities/ordem-servico';

const STATUS_PRIORITY: Partial<Record<StatusOrdemServico, number>> = {
  EM_EXECUCAO: 1,
  APROVADA: 2,
  AGUARDANDO_APROVACAO: 3,
  EM_DIAGNOSTICO: 4,
  RECEBIDA: 5,
};

const HIDDEN_STATUSES: StatusOrdemServico[] = ['FINALIZADA', 'ENTREGUE'];

export class ListarOrdensServico {
  constructor(private repo: IOrdemRepository) {}

  async execute() {
    const todas = await this.repo.all();

    return todas
      .filter((os) => !HIDDEN_STATUSES.includes(os.getStatus()))
      .sort((a, b) => {
        const prioA = STATUS_PRIORITY[a.getStatus()] ?? 99;
        const prioB = STATUS_PRIORITY[b.getStatus()] ?? 99;
        if (prioA !== prioB) return prioA - prioB;
        return a.getCriadaEm().getTime() - b.getCriadaEm().getTime();
      });
  }
}
