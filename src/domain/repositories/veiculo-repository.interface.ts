import { Veiculo } from '../entities/veiculo';

export interface IVeiculoRepository {
  save(veiculo: Veiculo): Promise<void>;
  getById(id: string): Promise<Veiculo | null>;
  all(): Promise<Veiculo[]>;
  clear(): Promise<void>;
}
