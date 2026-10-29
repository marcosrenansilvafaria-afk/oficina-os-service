import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdemServicoController } from './ordem-servico.controller';
import { resetInMemoryRepositories } from '../../infraestructure/singletons';
import { AdicionarItemOrdemServicoDto } from './dto/ordem-servico.dto';

describe('OrdemServicoController', () => {
  beforeEach(async () => {
    await resetInMemoryRepositories();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function criarController() {
    return new OrdemServicoController();
  }

  function itemServicoPadrao(): AdicionarItemOrdemServicoDto {
    return {
      tipo: 'SERVICO',
      descricao: 'Troca de oleo',
      preco: 120,
      quantidade: 1,
    };
  }

  it('deve criar os e retornar dados padrao no buscar e listar', async () => {
    const controller = criarController();
    const created = await controller.criar({});

    const buscada = (await controller.buscar(created.id)) as {
      id: string;
      envioOrcamento: { status: 'NAO_ENVIADO' | 'ENVIADO' };
      tempoExecucaoMs: number | null;
    };

    expect(buscada.id).toBe(created.id);
    expect(buscada.envioOrcamento.status).toBe('NAO_ENVIADO');
    expect(buscada.tempoExecucaoMs).toBeNull();

    const listagem = (await controller.listar()) as Array<{ id: string }>;
    expect(listagem).toHaveLength(1);
    expect(listagem[0].id).toBe(created.id);
  });

  it('deve validar clienteId e veiculoId no criar', async () => {
    const controller = criarController();

    await expect(controller.criar({ clienteId: 'x' })).rejects.toThrow(
      BadRequestException,
    );

    await expect(controller.criar({ veiculoId: 'y' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('deve retornar not found no buscar para id inexistente', async () => {
    const controller = criarController();

    await expect(controller.buscar('nao-existe')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deve retornar not found no adicionar para os inexistente', async () => {
    const controller = criarController();

    await expect(
      controller.adicionar('nao-existe', itemServicoPadrao()),
    ).rejects.toThrow(NotFoundException);
  });

  it('deve converter erro de regra no adicionar para bad request', async () => {
    const controller = criarController();
    const created = await controller.criar({});

    await expect(
      controller.adicionar(created.id, itemServicoPadrao()),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve diagnosticar e adicionar item com sucesso', async () => {
    const controller = criarController();
    const created = await controller.criar({});

    const diagnosticada = await controller.diagnostico(created.id);
    expect(diagnosticada.getStatus()).toBe('EM_DIAGNOSTICO');

    const atualizada = await controller.adicionar(
      created.id,
      itemServicoPadrao(),
    );
    expect(atualizada.getItens()).toHaveLength(1);
  });

  it('deve gerar e enviar orcamento quando os estiver pronta', async () => {
    const controller = criarController();
    const created = await controller.criar({});

    await controller.diagnostico(created.id);
    await controller.adicionar(created.id, itemServicoPadrao());

    const orcada = await controller.gerar(created.id);
    expect(orcada.getStatus()).toBe('AGUARDANDO_APROVACAO');

    const envio = (await controller.enviarOrcamento(created.id)) as {
      ordemServicoId: string;
      status: 'NAO_ENVIADO' | 'ENVIADO';
      enviadoEm?: string;
    };
    expect(envio.ordemServicoId).toBe(created.id);
    expect(envio.status).toBe('ENVIADO');
    expect(envio.enviadoEm).toBeDefined();
  });

  it('deve bloquear envio de orcamento em status invalido', async () => {
    const controller = criarController();
    const created = await controller.criar({});

    await expect(controller.enviarOrcamento(created.id)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('deve converter erro no aprovar para bad request', async () => {
    const controller = criarController();
    const created = await controller.criar({});

    await expect(controller.aprovar(created.id)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('deve executar, finalizar, consultar SLA e entregar', async () => {
    const controller = criarController();
    const nowSpy = jest.spyOn(Date, 'now');

    nowSpy
      .mockReturnValueOnce(1000)
      .mockReturnValueOnce(2000)
      .mockReturnValueOnce(5000)
      .mockReturnValueOnce(5000);

    const created = await controller.criar({});

    await controller.diagnostico(created.id);
    await controller.adicionar(created.id, itemServicoPadrao());
    await controller.gerar(created.id);
    await controller.aprovar(created.id);

    const emExecucao = await controller.executar(created.id);
    expect(emExecucao.getStatus()).toBe('EM_EXECUCAO');

    const finalizada = (await controller.finalizar(created.id)) as {
      status: string;
      tempoExecucaoMs: number | null;
    };
    expect(finalizada.status).toBe('FINALIZADA');
    expect(finalizada.tempoExecucaoMs).toBe(3000);

    const sla = await controller.slaAtendimento();
    expect(sla.totalOrdensConcluidas).toBe(1);
    expect(sla.slaMedioAtendimentoMs).toBe(4000);

    const entregue = await controller.entregar(created.id);
    expect(entregue.getStatus()).toBe('ENTREGUE');
  });

  it('deve converter erro no executar para bad request', async () => {
    const controller = criarController();
    const created = await controller.criar({});

    await expect(controller.executar(created.id)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('deve retornar not found em operacoes quando os nao existe', async () => {
    const controller = criarController();

    await expect(controller.gerar('nao-existe')).rejects.toThrow(
      NotFoundException,
    );
    await expect(controller.aprovar('nao-existe')).rejects.toThrow(
      NotFoundException,
    );
    await expect(controller.diagnostico('nao-existe')).rejects.toThrow(
      NotFoundException,
    );
    await expect(controller.executar('nao-existe')).rejects.toThrow(
      NotFoundException,
    );
    await expect(controller.finalizar('nao-existe')).rejects.toThrow(
      NotFoundException,
    );
    await expect(controller.entregar('nao-existe')).rejects.toThrow(
      NotFoundException,
    );
    await expect(controller.enviarOrcamento('nao-existe')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deve retornar status da OS com label em PT-BR', async () => {
    const controller = criarController();
    const created = await controller.criar({});

    const statusResp = await controller.status(created.id);
    expect(statusResp.id).toBe(created.id);
    expect(statusResp.status).toBe('RECEBIDA');
    expect(statusResp.statusLabel).toBe('Recebida');
  });

  it('deve retornar not found no status para os inexistente', async () => {
    const controller = criarController();

    await expect(controller.status('nao-existe')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deve aprovar orcamento via webhook', async () => {
    const controller = criarController();
    const created = await controller.criar({});

    await controller.diagnostico(created.id);
    await controller.adicionar(created.id, itemServicoPadrao());
    await controller.gerar(created.id);

    const resultado = await controller.webhookOrcamento(created.id, {
      aprovado: true,
    });
    expect(resultado.getStatus()).toBe('APROVADA');
  });

  it('deve recusar orcamento via webhook e voltar para EM_DIAGNOSTICO', async () => {
    const controller = criarController();
    const created = await controller.criar({});

    await controller.diagnostico(created.id);
    await controller.adicionar(created.id, itemServicoPadrao());
    await controller.gerar(created.id);

    const resultado = await controller.webhookOrcamento(created.id, {
      aprovado: false,
    });
    expect(resultado.getStatus()).toBe('EM_DIAGNOSTICO');
  });
});
