import { IOrdemRepository } from '../../domain/repositories/ordem-repository.interface';
import { NotificadorStatus } from '../ports/notificador-status';

export class FinalizarOrdemServico {
  constructor(
    private repo: IOrdemRepository,
    private notificador?: NotificadorStatus,
  ) {}

  async execute(id: string) {
    const os = await this.repo.getById(id);
    if (!os) throw new Error('OS não encontrada');

    const statusAnterior = os.getStatus();
    os.finalizar();
    await this.repo.save(os);
    await this.notificador?.notificar(os, statusAnterior);
    return os;
  }
}
