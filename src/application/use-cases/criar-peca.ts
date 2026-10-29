import { Peca } from '../../domain/entities/peca';
import { IPecaRepository } from '../../domain/repositories/peca-repository.interface';
import { generateId } from '../../utils/id';

type Input = { nome: string; preco: number; estoque?: number };

export class CriarPeca {
  constructor(private repo: IPecaRepository) {}

  async execute(input: Input) {
    if (!input || !input.nome) throw new Error('nome é obrigatório');
    const peca = new Peca(
      generateId(),
      input.nome,
      input.preco || 0,
      input.estoque || 0,
    );
    await this.repo.save(peca);
    return peca;
  }
}
