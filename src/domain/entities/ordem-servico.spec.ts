import { ItemOrdemServico } from './item-ordem-servico';
import { OrdemServico } from './ordem-servico';

describe('OrdemServico', () => {
  function criarItem(
    tipo: 'PECA' | 'SERVICO' = 'SERVICO',
    preco = 100,
    quantidade = 1,
  ) {
    return new ItemOrdemServico(tipo, 'Item teste', preco, quantidade);
  }

  it('deve iniciar com status RECEBIDA e sem itens', () => {
    const os = new OrdemServico('os-1');

    expect(os.getStatus()).toBe('RECEBIDA');
    expect(os.getItens()).toHaveLength(0);
    expect(os.getValorTotal()).toBe(0);
  });

  it('deve permitir adicionar item somente em EM_DIAGNOSTICO', () => {
    const os = new OrdemServico('os-1');

    expect(() => os.adicionarItem(criarItem())).toThrow(
      'Não é possível adicionar itens neste status',
    );

    os.iniciarDiagnostico();
    os.adicionarItem(criarItem());

    expect(os.getItens()).toHaveLength(1);
  });

  it('deve gerar orcamento somando itens e alterar para AGUARDANDO_APROVACAO', () => {
    const os = new OrdemServico('os-1');

    os.iniciarDiagnostico();
    os.adicionarItem(criarItem('SERVICO', 120, 2));
    os.adicionarItem(criarItem('PECA', 30, 3));
    os.gerarOrcamento();

    expect(os.getValorTotal()).toBe(330);
    expect(os.getStatus()).toBe('AGUARDANDO_APROVACAO');
  });

  it('deve impedir gerar orcamento sem itens', () => {
    const os = new OrdemServico('os-1');

    expect(() => os.gerarOrcamento()).toThrow(
      'Não é possível gerar orçamento sem itens',
    );
  });

  it('deve executar fluxo completo ate ENTREGUE', () => {
    const os = new OrdemServico('os-1');

    os.iniciarDiagnostico();
    os.adicionarItem(criarItem('SERVICO', 100, 1));
    os.gerarOrcamento();
    os.aprovarOrcamento();
    os.iniciarExecucao();
    os.finalizar();
    os.entregar();

    expect(os.getStatus()).toBe('ENTREGUE');
  });

  it('deve impedir transicoes invalidas de estado', () => {
    const os = new OrdemServico('os-1');

    expect(() => os.aprovarOrcamento()).toThrow(
      'Orçamento não está disponível para aprovação',
    );
    expect(() => os.iniciarExecucao()).toThrow(
      'Não pode iniciar execução sem aprovação',
    );
    expect(() => os.finalizar()).toThrow(
      'Só pode finalizar se estiver em execução',
    );
    expect(() => os.entregar()).toThrow('Só pode entregar após finalização');
  });

  it('deve permitir retornar de AGUARDANDO_APROVACAO para EM_DIAGNOSTICO', () => {
    const os = new OrdemServico('os-1');

    os.iniciarDiagnostico();
    os.adicionarItem(criarItem());
    os.gerarOrcamento();

    expect(os.getStatus()).toBe('AGUARDANDO_APROVACAO');

    os.iniciarDiagnostico();
    expect(os.getStatus()).toBe('EM_DIAGNOSTICO');
  });

  it('deve compensar (CANCELADA) uma OS em execucao quando o Saga falha', () => {
    const os = new OrdemServico('os-1');

    os.iniciarDiagnostico();
    os.adicionarItem(criarItem());
    os.gerarOrcamento();
    os.aprovarOrcamento();
    os.iniciarExecucao();

    os.compensarExecucao();

    expect(os.getStatus()).toBe('CANCELADA');
  });

  it('deve impedir compensar uma OS que nao esta em execucao', () => {
    const os = new OrdemServico('os-1');

    expect(() => os.compensarExecucao()).toThrow(
      'Só é possível compensar uma OS que está em execução',
    );
  });
});
