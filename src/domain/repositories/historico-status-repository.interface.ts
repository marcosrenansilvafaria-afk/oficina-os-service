import { StatusOrdemServico } from '../entities/ordem-servico';

export interface IHistoricoStatusRepository {
  registrar(ordemServicoId: string, status: StatusOrdemServico): Promise<void>;
  clear(): Promise<void>;
}
