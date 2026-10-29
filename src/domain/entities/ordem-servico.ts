import { ItemOrdemServico } from './item-ordem-servico';

export type StatusOrdemServico =
  | 'RECEBIDA'
  | 'EM_DIAGNOSTICO'
  | 'AGUARDANDO_APROVACAO'
  | 'APROVADA'
  | 'EM_EXECUCAO'
  | 'FINALIZADA'
  | 'ENTREGUE'
  | 'CANCELADA';

export class OrdemServico {
  private status: StatusOrdemServico;
  private itens: ItemOrdemServico[] = [];
  private valorTotal: number = 0;
  private criadaEm: Date;
  private finalizadaEm?: Date;

  constructor(
    public readonly id: string,
    public readonly clienteId?: string,
    public readonly veiculoId?: string,
  ) {
    this.status = 'RECEBIDA';
    this.criadaEm = new Date(Date.now());
  }

  // 🔹 Adicionar item
  adicionarItem(item: ItemOrdemServico) {
    if (this.status !== 'EM_DIAGNOSTICO') {
      throw new Error(
        'Não é possível adicionar itens neste status — só em EM_DIAGNOSTICO',
      );
    }

    this.itens.push(item);
  }

  // 🔹 Gerar orçamento
  gerarOrcamento() {
    if (this.itens.length === 0) {
      throw new Error('Não é possível gerar orçamento sem itens');
    }

    this.valorTotal = this.itens.reduce((acc, item) => acc + item.total(), 0);

    this.status = 'AGUARDANDO_APROVACAO';
  }

  // 🔹 Iniciar diagnóstico
  iniciarDiagnostico() {
    if (this.status !== 'RECEBIDA' && this.status !== 'AGUARDANDO_APROVACAO') {
      throw new Error(
        'Só é possível iniciar diagnóstico quando a OS está RECEBIDA',
      );
    }

    this.status = 'EM_DIAGNOSTICO';
  }

  // 🔹 Aprovar orçamento
  aprovarOrcamento() {
    if (this.status !== 'AGUARDANDO_APROVACAO') {
      throw new Error('Orçamento não está disponível para aprovação');
    }

    this.status = 'APROVADA';
  }

  // 🔹 Recusar orçamento (cliente reprovou) — reabre para novo diagnóstico
  recusarOrcamento() {
    if (this.status !== 'AGUARDANDO_APROVACAO') {
      throw new Error('Orçamento não está disponível para recusa');
    }

    this.status = 'EM_DIAGNOSTICO';
  }

  // 🔹 Iniciar execução
  iniciarExecucao() {
    if (this.status !== 'APROVADA') {
      throw new Error('Não pode iniciar execução sem aprovação');
    }

    this.status = 'EM_EXECUCAO';
  }

  // 🔹 Finalizar OS
  finalizar() {
    if (this.status !== 'EM_EXECUCAO') {
      throw new Error('Só pode finalizar se estiver em execução');
    }

    this.status = 'FINALIZADA';
    this.finalizadaEm = new Date(Date.now());
  }

  // 🔹 Entregar veículo
  entregar() {
    if (this.status !== 'FINALIZADA') {
      throw new Error('Só pode entregar após finalização');
    }

    this.status = 'ENTREGUE';
  }

  // 🔹 Compensação do Saga: falha de execução após pagamento já aprovado.
  // Diferente de recusarOrcamento() (reabre para novo diagnóstico), este é um
  // estado terminal — o reparo já estava em andamento e não pode ser retomado
  // a partir de um novo orçamento; o reembolso é responsabilidade do Billing Service.
  compensarExecucao() {
    if (this.status !== 'EM_EXECUCAO') {
      throw new Error('Só é possível compensar uma OS que está em execução');
    }

    this.status = 'CANCELADA';
  }

  // 🔹 Reconstitui a entidade a partir de dados de persistência (sem passar pela máquina de estados)
  static reconstitute(
    id: string,
    clienteId: string,
    veiculoId: string,
    status: StatusOrdemServico,
    itens: ItemOrdemServico[],
    valorTotal: number,
    criadaEm: Date,
    finalizadaEm?: Date,
  ): OrdemServico {
    const os = new OrdemServico(id, clienteId, veiculoId);
    os.status = status;
    os.itens = itens;
    os.valorTotal = valorTotal;
    os.criadaEm = criadaEm;
    os.finalizadaEm = finalizadaEm;
    return os;
  }

  // 🔹 getters (boa prática)
  getStatus() {
    return this.status;
  }

  getItens() {
    return this.itens;
  }

  getValorTotal() {
    return this.valorTotal;
  }

  getCriadaEm() {
    return this.criadaEm;
  }

  getFinalizadaEm() {
    return this.finalizadaEm;
  }
}
