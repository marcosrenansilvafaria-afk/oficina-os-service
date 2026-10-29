import { Veiculo } from '../domain/entities/veiculo';
import { IVeiculoRepository } from '../domain/repositories/veiculo-repository.interface';

export class InMemoryVeiculoRepository implements IVeiculoRepository {
  private store = new Map<string, Veiculo>();

  save(veiculo: Veiculo): Promise<void> {
    this.store.set(veiculo.id, veiculo);
    return Promise.resolve();
  }

  getById(id: string): Promise<Veiculo | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  all(): Promise<Veiculo[]> {
    return Promise.resolve(Array.from(this.store.values()));
  }

  clear(): Promise<void> {
    this.store.clear();
    return Promise.resolve();
  }
}
