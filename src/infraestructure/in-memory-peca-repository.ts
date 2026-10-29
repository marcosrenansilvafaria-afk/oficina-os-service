import { Peca } from '../domain/entities/peca';
import { IPecaRepository } from '../domain/repositories/peca-repository.interface';

export class InMemoryPecaRepository implements IPecaRepository {
  private store = new Map<string, Peca>();

  save(peca: Peca): Promise<void> {
    this.store.set(peca.id, peca);
    return Promise.resolve();
  }

  getById(id: string): Promise<Peca | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  all(): Promise<Peca[]> {
    return Promise.resolve(Array.from(this.store.values()));
  }

  clear(): Promise<void> {
    this.store.clear();
    return Promise.resolve();
  }
}
