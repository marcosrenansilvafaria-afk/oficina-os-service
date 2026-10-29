import { Servico } from '../../domain/entities/servico';
import { IServicoRepository } from '../../domain/repositories/servico-repository.interface';
import { generateId } from '../../utils/id';

type Input = { nome: string; preco: number };

export class CriarServico {
  constructor(private repo: IServicoRepository) {}

  async execute(input: Input) {
    if (!input || !input.nome) throw new Error('nome é obrigatório');
    const servico = new Servico(generateId(), input.nome, input.preco || 0);
    await this.repo.save(servico);
    return servico;
  }
}
