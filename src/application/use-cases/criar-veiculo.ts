import { Veiculo } from '../../domain/entities/veiculo';
import { IVeiculoRepository } from '../../domain/repositories/veiculo-repository.interface';
import { generateId } from '../../utils/id';

type Input = { placa: string; modelo: string; marca: string; ano: number };

export class CriarVeiculo {
  constructor(private repo: IVeiculoRepository) {}

  async execute(input?: Input) {
    const veiculo = new Veiculo(
      generateId(),
      input?.placa || '',
      input?.modelo || '',
      input?.marca || '',
      input?.ano || 0,
    );
    await this.repo.save(veiculo);
    return veiculo;
  }
}
