import { OrdemServico } from '../entities/ordem-servico';

export interface IOrdemRepository {
  save(ordem: OrdemServico): Promise<void>;
  getById(id: string): Promise<OrdemServico | null>;
  exists(id: string): Promise<boolean>;
  all(): Promise<OrdemServico[]>;
  clear(): Promise<void>;
}
