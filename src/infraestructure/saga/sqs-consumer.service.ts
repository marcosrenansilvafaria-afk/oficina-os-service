import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
} from '@aws-sdk/client-sqs';
import { AprovarOrcamento } from '../../application/use-cases/aprovar-orcamento';
import { IniciarExecucao } from '../../application/use-cases/iniciar-execucao';
import { FinalizarOrdemServico } from '../../application/use-cases/finalizar-ordem-servico';
import { CompensarOrdemServico } from '../../application/use-cases/compensar-ordem-servico';
import {
  ordemRepo,
  notificadorStatus,
  historicoStatusRepo,
} from '../singletons';
import { integracaoErrosTotal } from '../observability/metrics-registry';

interface SagaEventEnvelope {
  eventId: string;
  eventType: string;
  correlationId: string;
  payload: Record<string, unknown>;
}

/**
 * Consome a fila SQS FIFO deste servico (oficina-saga-os-service.fifo,
 * provisionada em oficina-messaging-infra) via long-polling. Reaproveita as
 * mesmas use-cases dos controllers HTTP - a reacao a um evento do Saga e
 * tratada exatamente como a acao equivalente feita por um humano via API.
 */
@Injectable()
export class SqsConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SqsConsumerService.name);
  private readonly client: SQSClient;
  private readonly queueUrl = process.env.SAGA_QUEUE_URL || '';
  private stopped = false;

  private readonly aprovarOrcamento = new AprovarOrcamento(
    ordemRepo,
    notificadorStatus,
  );
  private readonly iniciarExecucao = new IniciarExecucao(
    ordemRepo,
    notificadorStatus,
  );
  private readonly finalizarOrdem = new FinalizarOrdemServico(
    ordemRepo,
    notificadorStatus,
  );
  private readonly compensarOrdem = new CompensarOrdemServico(
    ordemRepo,
    notificadorStatus,
  );

  constructor() {
    this.client = new SQSClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  onModuleInit() {
    if (!this.queueUrl) {
      this.logger.warn(
        'SAGA_QUEUE_URL nao configurada - consumidor do Saga desabilitado (ambiente de dev local).',
      );
      return;
    }
    void this.poll();
  }

  onModuleDestroy() {
    this.stopped = true;
  }

  private async poll(): Promise<void> {
    while (!this.stopped) {
      try {
        const result = await this.client.send(
          new ReceiveMessageCommand({
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: 5,
            WaitTimeSeconds: 20,
          }),
        );

        for (const message of result.Messages ?? []) {
          await this.processar(message);
        }
      } catch (err) {
        this.logger.error('Erro ao consumir fila do Saga', err as Error);
        integracaoErrosTotal.inc({ integracao: 'saga-sqs-consumer' });
      }
    }
  }

  private async processar(message: Message): Promise<void> {
    if (!message.Body) return;

    try {
      const envelope = JSON.parse(message.Body) as SagaEventEnvelope;
      await this.despachar(envelope);

      await this.client.send(
        new DeleteMessageCommand({
          QueueUrl: this.queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        }),
      );
    } catch (err) {
      this.logger.error(
        `Falha ao processar evento do Saga (ficara na fila para retry/DLQ): ${(err as Error).message}`,
      );
      integracaoErrosTotal.inc({ integracao: 'saga-sqs-consumer' });
    }
  }

  private async despachar(envelope: SagaEventEnvelope): Promise<void> {
    const { eventType, payload, correlationId } = envelope;
    const ordemServicoId =
      (payload.ordemServicoId as string | undefined) ?? correlationId;

    this.logger.log({ correlationId, eventType }, 'Processando evento do Saga');

    switch (eventType) {
      case 'PagamentoAprovadoEvent': {
        const os = await this.aprovarOrcamento.execute(ordemServicoId);
        await historicoStatusRepo.registrar(ordemServicoId, os.getStatus());
        break;
      }
      case 'ExecucaoIniciadaEvent': {
        const os = await this.iniciarExecucao.execute(ordemServicoId);
        await historicoStatusRepo.registrar(ordemServicoId, os.getStatus());
        break;
      }
      case 'ExecucaoConcluidaEvent': {
        const os = await this.finalizarOrdem.execute(ordemServicoId);
        await historicoStatusRepo.registrar(ordemServicoId, os.getStatus());
        break;
      }
      case 'CompensarOSEvent': {
        const origemFalha = payload.origemFalha as 'PAGAMENTO' | 'EXECUCAO';
        const os = await this.compensarOrdem.execute(
          ordemServicoId,
          origemFalha,
        );
        await historicoStatusRepo.registrar(ordemServicoId, os.getStatus());
        break;
      }
      default:
        this.logger.warn(`Evento do Saga nao reconhecido: ${eventType}`);
        return;
    }

    this.logger.log(
      { correlationId, eventType },
      'Evento do Saga processado com sucesso',
    );
  }
}
