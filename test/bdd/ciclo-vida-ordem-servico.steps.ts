import { join } from 'path';
import { defineFeature, loadFeature } from 'jest-cucumber';
import { InMemoryOrdemRepository } from '../../src/infraestructure/in-memory-ordem-repository';
import { CriarOrdemServico } from '../../src/application/use-cases/criar-ordem-servico';
import { IniciarDiagnostico } from '../../src/application/use-cases/iniciar-diagnostico';
import { AdicionarItemOrdemServico } from '../../src/application/use-cases/adicionar-item-ordem-servico';
import { GerarOrcamento } from '../../src/application/use-cases/gerar-orcamento';
import { AprovarOrcamento } from '../../src/application/use-cases/aprovar-orcamento';
import { IniciarExecucao } from '../../src/application/use-cases/iniciar-execucao';
import { FinalizarOrdemServico } from '../../src/application/use-cases/finalizar-ordem-servico';
import { CompensarOrdemServico } from '../../src/application/use-cases/compensar-ordem-servico';
import { OrdemServico } from '../../src/domain/entities/ordem-servico';

const feature = loadFeature(
  join(__dirname, 'ciclo-vida-ordem-servico.feature'),
);

/**
 * Simula a reacao do servico a um evento recebido do Saga (SqsConsumerService
 * despacha exatamente dessa forma - ver infraestructure/saga/sqs-consumer.service.ts),
 * sem depender de AWS real.
 */
async function receberEvento(
  repo: InMemoryOrdemRepository,
  id: string,
  eventType: string,
  origemFalha?: 'PAGAMENTO' | 'EXECUCAO',
) {
  switch (eventType) {
    case 'PagamentoAprovadoEvent':
      return new AprovarOrcamento(repo).execute(id);
    case 'ExecucaoIniciadaEvent':
      return new IniciarExecucao(repo).execute(id);
    case 'ExecucaoConcluidaEvent':
      return new FinalizarOrdemServico(repo).execute(id);
    case 'CompensarOSEvent':
      return new CompensarOrdemServico(repo).execute(id, origemFalha!);
    default:
      throw new Error(`Evento desconhecido: ${eventType}`);
  }
}

defineFeature(feature, (test) => {
  let repo: InMemoryOrdemRepository;
  let ordem: OrdemServico;

  beforeEach(() => {
    repo = new InMemoryOrdemRepository();
  });

  test('Fluxo feliz completo ate a finalizacao', ({
    given,
    when,
    then,
    and,
  }) => {
    const statusDeveSer = (statusEsperado: string) => {
      expect(ordem.getStatus()).toBe(statusEsperado);
    };
    const eventoRecebido = async (eventType: string) => {
      ordem = await receberEvento(repo, ordem.id, eventType);
    };

    given(
      'uma ordem de servico recebida para um cliente e veiculo',
      async () => {
        ordem = await new CriarOrdemServico(repo).execute({
          clienteId: 'cli-001',
          veiculoId: 'vei-001',
        });
      },
    );

    when('o atendente inicia o diagnostico', async () => {
      ordem = await new IniciarDiagnostico(repo).execute(ordem.id);
    });

    and(
      'adiciona um item de servico com preco 150 e quantidade 1',
      async () => {
        ordem = await new AdicionarItemOrdemServico(repo).execute(ordem.id, {
          tipo: 'SERVICO',
          descricao: 'Revisao completa',
          preco: 150,
          quantidade: 1,
        });
      },
    );

    and('gera o orcamento', async () => {
      ordem = await new GerarOrcamento(repo).execute(ordem.id);
    });

    then('o valor total da ordem deve ser 150', () => {
      expect(ordem.getValorTotal()).toBe(150);
    });

    and(/^o status da ordem deve ser "(.*)"$/, statusDeveSer); // AGUARDANDO_APROVACAO

    when(/^o evento (.*) e recebido$/, eventoRecebido); // PagamentoAprovadoEvent
    then(/^o status da ordem deve ser "(.*)"$/, statusDeveSer); // APROVADA

    when(/^o evento (.*) e recebido$/, eventoRecebido); // ExecucaoIniciadaEvent
    then(/^o status da ordem deve ser "(.*)"$/, statusDeveSer); // EM_EXECUCAO

    when(/^o evento (.*) e recebido$/, eventoRecebido); // ExecucaoConcluidaEvent
    then(/^o status da ordem deve ser "(.*)"$/, statusDeveSer); // FINALIZADA
  });

  test('Compensacao por pagamento recusado', ({ given, when, then }) => {
    given('uma ordem de servico com orcamento gerado', async () => {
      ordem = await new CriarOrdemServico(repo).execute();
      ordem = await new IniciarDiagnostico(repo).execute(ordem.id);
      ordem = await new AdicionarItemOrdemServico(repo).execute(ordem.id, {
        tipo: 'SERVICO',
        descricao: 'Revisao',
        preco: 100,
        quantidade: 1,
      });
      ordem = await new GerarOrcamento(repo).execute(ordem.id);
    });

    when(
      /^o evento CompensarOSEvent com origem "(.*)" e recebido$/,
      async (origemFalha: 'PAGAMENTO' | 'EXECUCAO') => {
        ordem = await receberEvento(
          repo,
          ordem.id,
          'CompensarOSEvent',
          origemFalha,
        );
      },
    );

    then(/^o status da ordem deve ser "(.*)"$/, (statusEsperado: string) => {
      expect(ordem.getStatus()).toBe(statusEsperado);
    });
  });

  test('Compensacao por falha de execucao', ({ given, when, then }) => {
    given('uma ordem de servico aprovada e em execucao', async () => {
      ordem = await new CriarOrdemServico(repo).execute();
      ordem = await new IniciarDiagnostico(repo).execute(ordem.id);
      ordem = await new AdicionarItemOrdemServico(repo).execute(ordem.id, {
        tipo: 'SERVICO',
        descricao: 'Revisao',
        preco: 100,
        quantidade: 1,
      });
      ordem = await new GerarOrcamento(repo).execute(ordem.id);
      ordem = await new AprovarOrcamento(repo).execute(ordem.id);
      ordem = await new IniciarExecucao(repo).execute(ordem.id);
    });

    when(
      /^o evento CompensarOSEvent com origem "(.*)" e recebido$/,
      async (origemFalha: 'PAGAMENTO' | 'EXECUCAO') => {
        ordem = await receberEvento(
          repo,
          ordem.id,
          'CompensarOSEvent',
          origemFalha,
        );
      },
    );

    then(/^o status da ordem deve ser "(.*)"$/, (statusEsperado: string) => {
      expect(ordem.getStatus()).toBe(statusEsperado);
    });
  });
});
