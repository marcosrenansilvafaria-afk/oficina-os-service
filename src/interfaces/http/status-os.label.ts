import { StatusOrdemServico } from '../../domain/entities/ordem-servico';

export const STATUS_LABEL: Record<StatusOrdemServico, string> = {
  RECEBIDA: 'Recebida',
  EM_DIAGNOSTICO: 'Diagnóstico',
  AGUARDANDO_APROVACAO: 'Aguardando Aprovação',
  APROVADA: 'Aprovada',
  EM_EXECUCAO: 'Em Execução',
  FINALIZADA: 'Finalizada',
  ENTREGUE: 'Entregue',
  CANCELADA: 'Cancelada (compensação do Saga)',
};
