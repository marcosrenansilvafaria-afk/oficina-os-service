import { Cliente } from '../entities/cliente';

export interface IClienteRepository {
  save(cliente: Cliente): Promise<void>;
  getById(id: string): Promise<Cliente | null>;
  all(): Promise<Cliente[]>;
  clear(): Promise<void>;
}
