import { OrdemServico } from '../domain/entities/ordem-servico';
import { IOrdemRepository } from '../domain/repositories/ordem-repository.interface';

export class InMemoryOrdemRepository implements IOrdemRepository {
  private store = new Map<string, OrdemServico>();

  save(ordem: OrdemServico): Promise<void> {
    this.store.set(ordem.id, ordem);
    return Promise.resolve();
  }

  getById(id: string): Promise<OrdemServico | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  exists(id: string): Promise<boolean> {
    return Promise.resolve(this.store.has(id));
  }

  all(): Promise<OrdemServico[]> {
    return Promise.resolve(Array.from(this.store.values()));
  }

  clear(): Promise<void> {
    this.store.clear();
    return Promise.resolve();
  }
}
