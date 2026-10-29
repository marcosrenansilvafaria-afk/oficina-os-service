import { IPecaRepository } from '../../domain/repositories/peca-repository.interface';

export class ListarPeca {
  constructor(private repo: IPecaRepository) {}

  async execute() {
    return this.repo.all();
  }
}
