import { Servico } from '../domain/entities/servico';
import { IServicoRepository } from '../domain/repositories/servico-repository.interface';

export class InMemoryServicoRepository implements IServicoRepository {
  private store = new Map<string, Servico>();

  save(servico: Servico): Promise<void> {
    this.store.set(servico.id, servico);
    return Promise.resolve();
  }

  getById(id: string): Promise<Servico | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  all(): Promise<Servico[]> {
    return Promise.resolve(Array.from(this.store.values()));
  }

  clear(): Promise<void> {
    this.store.clear();
    return Promise.resolve();
  }
}
