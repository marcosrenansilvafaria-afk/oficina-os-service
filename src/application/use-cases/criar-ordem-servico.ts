import { OrdemServico } from '../../domain/entities/ordem-servico';
import { IOrdemRepository } from '../../domain/repositories/ordem-repository.interface';
import { IClienteRepository } from '../../domain/repositories/cliente-repository.interface';
import { IVeiculoRepository } from '../../domain/repositories/veiculo-repository.interface';
import { generateId } from '../../utils/id';

type Input = { clienteId?: string; veiculoId?: string };

export class CriarOrdemServico {
  constructor(
    private repo: IOrdemRepository,
    private clienteRepo?: IClienteRepository,
    private veiculoRepo?: IVeiculoRepository,
  ) {}

  async execute(input?: Input) {
    const clienteId = input?.clienteId;
    const veiculoId = input?.veiculoId;

    if (clienteId && this.clienteRepo) {
      const cliente = await this.clienteRepo.getById(clienteId);
      if (!cliente) throw new Error('clienteId inválido');
    }

    if (veiculoId && this.veiculoRepo) {
      const veiculo = await this.veiculoRepo.getById(veiculoId);
      if (!veiculo) throw new Error('veiculoId inválido');
    }

    const os = new OrdemServico(generateId(), clienteId, veiculoId);
    await this.repo.save(os);
    return os;
  }
}
