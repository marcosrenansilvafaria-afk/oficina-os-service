import { IServicoRepository } from '../../domain/repositories/servico-repository.interface';

export class ListarServico {
  constructor(private repo: IServicoRepository) {}

  async execute() {
    return this.repo.all();
  }
}
