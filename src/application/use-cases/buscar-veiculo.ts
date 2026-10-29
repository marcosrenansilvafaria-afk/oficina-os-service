import { Veiculo } from '../../domain/entities/veiculo';

export class BuscarVeiculo {
  execute(veiculo?: Veiculo) {
    if (!veiculo) throw new Error('Veículo não encontrado');
    return veiculo;
  }
}
