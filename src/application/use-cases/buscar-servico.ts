import { Servico } from '../../domain/entities/servico';

export class BuscarServico {
  execute(servico?: Servico) {
    if (!servico) throw new Error('Serviço não encontrado');
    return servico;
  }
}
