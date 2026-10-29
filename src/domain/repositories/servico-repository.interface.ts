import { Servico } from '../entities/servico';

export interface IServicoRepository {
  save(servico: Servico): Promise<void>;
  getById(id: string): Promise<Servico | null>;
  all(): Promise<Servico[]>;
  clear(): Promise<void>;
}
