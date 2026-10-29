import { Peca } from '../entities/peca';

export interface IPecaRepository {
  save(peca: Peca): Promise<void>;
  getById(id: string): Promise<Peca | null>;
  all(): Promise<Peca[]>;
  clear(): Promise<void>;
}
