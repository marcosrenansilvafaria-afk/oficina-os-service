import { Cliente } from '../domain/entities/cliente';
import { IClienteRepository } from '../domain/repositories/cliente-repository.interface';

export class InMemoryClienteRepository implements IClienteRepository {
  private store = new Map<string, Cliente>();

  save(cliente: Cliente): Promise<void> {
    this.store.set(cliente.id, cliente);
    return Promise.resolve();
  }

  getById(id: string): Promise<Cliente | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  all(): Promise<Cliente[]> {
    return Promise.resolve(Array.from(this.store.values()));
  }

  clear(): Promise<void> {
    this.store.clear();
    return Promise.resolve();
  }
}
