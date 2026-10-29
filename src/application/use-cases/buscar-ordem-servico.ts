import { IOrdemRepository } from '../../domain/repositories/ordem-repository.interface';

export class BuscarOrdemServico {
  constructor(private repo: IOrdemRepository) {}

  async execute(id: string) {
    const os = await this.repo.getById(id);
    if (!os) throw new Error('OS não encontrada');
    return os;
  }
}
