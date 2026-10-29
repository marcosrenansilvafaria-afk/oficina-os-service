import { IPecaRepository } from '../../domain/repositories/peca-repository.interface';

export class AjustarEstoquePeca {
  constructor(private repo: IPecaRepository) {}

  async execute(id: string, delta: number) {
    const peca = await this.repo.getById(id);
    if (!peca) throw new Error('Peça não encontrada');
    peca.ajustarEstoque(delta);
    await this.repo.save(peca);
    return peca;
  }
}
