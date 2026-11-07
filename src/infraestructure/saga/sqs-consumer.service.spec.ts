import { SqsConsumerService } from './sqs-consumer.service';
import { ordemRepo } from '../singletons';
import { OrdemServico } from '../../domain/entities/ordem-servico';

jest.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
  ReceiveMessageCommand: jest.fn(),
  DeleteMessageCommand: jest.fn(),
}));

function seed(
  id: string,
  status: Parameters<typeof OrdemServico.reconstitute>[3],
) {
  const os = OrdemServico.reconstitute(
    id,
    'cliente-1',
    'veiculo-1',
    status,
    [],
    100,
    new Date(),
    undefined,
  );
  return ordemRepo.save(os);
}

async function despachar(service: SqsConsumerService, envelope: unknown) {
  await (
    service as unknown as { despachar(e: unknown): Promise<void> }
  ).despachar(envelope);
}

describe('SqsConsumerService', () => {
  let service: SqsConsumerService;

  beforeEach(() => {
    service = new SqsConsumerService();
  });

  it('PagamentoAprovadoEvent aprova o orcamento (AGUARDANDO_APROVACAO -> APROVADA)', async () => {
    await seed('os-1', 'AGUARDANDO_APROVACAO');

    await despachar(service, {
      eventId: 'e1',
      eventType: 'PagamentoAprovadoEvent',
      correlationId: 'os-1',
      payload: {},
    });

    const os = await ordemRepo.getById('os-1');
    expect(os?.getStatus()).toBe('APROVADA');
  });

  it('ExecucaoIniciadaEvent inicia a execucao (APROVADA -> EM_EXECUCAO)', async () => {
    await seed('os-2', 'APROVADA');

    await despachar(service, {
      eventId: 'e2',
      eventType: 'ExecucaoIniciadaEvent',
      correlationId: 'os-2',
      payload: { ordemServicoId: 'os-2' },
    });

    const os = await ordemRepo.getById('os-2');
    expect(os?.getStatus()).toBe('EM_EXECUCAO');
  });

  it('ExecucaoConcluidaEvent finaliza a OS (EM_EXECUCAO -> FINALIZADA)', async () => {
    await seed('os-3', 'EM_EXECUCAO');

    await despachar(service, {
      eventId: 'e3',
      eventType: 'ExecucaoConcluidaEvent',
      correlationId: 'os-3',
      payload: {},
    });

    const os = await ordemRepo.getById('os-3');
    expect(os?.getStatus()).toBe('FINALIZADA');
  });

  it('CompensarOSEvent com origemFalha=PAGAMENTO reabre para EM_DIAGNOSTICO', async () => {
    await seed('os-4', 'AGUARDANDO_APROVACAO');

    await despachar(service, {
      eventId: 'e4',
      eventType: 'CompensarOSEvent',
      correlationId: 'os-4',
      payload: { origemFalha: 'PAGAMENTO' },
    });

    const os = await ordemRepo.getById('os-4');
    expect(os?.getStatus()).toBe('EM_DIAGNOSTICO');
  });

  it('CompensarOSEvent com origemFalha=EXECUCAO cancela a OS', async () => {
    await seed('os-5', 'EM_EXECUCAO');

    await despachar(service, {
      eventId: 'e5',
      eventType: 'CompensarOSEvent',
      correlationId: 'os-5',
      payload: { origemFalha: 'EXECUCAO' },
    });

    const os = await ordemRepo.getById('os-5');
    expect(os?.getStatus()).toBe('CANCELADA');
  });

  it('ignora eventos de tipo desconhecido sem lancar erro', async () => {
    await seed('os-6', 'RECEBIDA');

    await expect(
      despachar(service, {
        eventId: 'e6',
        eventType: 'EventoInexistente',
        correlationId: 'os-6',
        payload: {},
      }),
    ).resolves.toBeUndefined();

    const os = await ordemRepo.getById('os-6');
    expect(os?.getStatus()).toBe('RECEBIDA');
  });

  it('usa correlationId como fallback quando o payload nao tem ordemServicoId', async () => {
    await seed('os-7', 'APROVADA');

    await despachar(service, {
      eventId: 'e7',
      eventType: 'ExecucaoIniciadaEvent',
      correlationId: 'os-7',
      payload: {},
    });

    const os = await ordemRepo.getById('os-7');
    expect(os?.getStatus()).toBe('EM_EXECUCAO');
  });
});
