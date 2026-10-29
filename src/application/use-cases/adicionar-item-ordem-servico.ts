import { ItemOrdemServico } from '../../domain/entities/item-ordem-servico';
import { IOrdemRepository } from '../../domain/repositories/ordem-repository.interface';
import { IPecaRepository } from '../../domain/repositories/peca-repository.interface';
import { IServicoRepository } from '../../domain/repositories/servico-repository.interface';

type Input = {
  tipo: 'PECA' | 'SERVICO';
  descricao?: string;
  preco?: number;
  quantidade: number;
  pecaId?: string;
  servicoId?: string;
};

export class AdicionarItemOrdemServico {
  constructor(
    private repo: IOrdemRepository,
    private pecaRepo?: IPecaRepository,
    private servicoRepo?: IServicoRepository,
  ) {}

  async execute(id: string, input: Input) {
    const os = await this.repo.getById(id);
    if (!os) throw new Error('OS não encontrada');

    let descricao = input.descricao;
    let preco = input.preco;

    if (input.pecaId) {
      if (!this.pecaRepo)
        throw new Error('Repositório de peças não configurado');
      const p = await this.pecaRepo.getById(input.pecaId);
      if (!p) throw new Error('Peça não encontrada');
      descricao = p.nome;
      preco = p.preco;
    } else if (input.servicoId) {
      if (!this.servicoRepo)
        throw new Error('Repositório de serviços não configurado');
      const s = await this.servicoRepo.getById(input.servicoId);
      if (!s) throw new Error('Serviço não encontrado');
      descricao = s.nome;
      preco = s.preco;
    }

    if (!descricao) throw new Error('descricao é obrigatória');
    if (!preco) preco = 0;

    const item = new ItemOrdemServico(
      input.tipo,
      descricao,
      preco,
      input.quantidade,
    );
    os.adicionarItem(item);
    await this.repo.save(os);
    return os;
  }
}
