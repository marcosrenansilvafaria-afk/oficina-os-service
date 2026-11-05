import { randomUUID } from 'crypto';
import { Logger } from '@nestjs/common';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SagaPublisher } from '../../application/ports/saga-publisher';

/**
 * Publica eventos do Saga no topico SNS FIFO unico
 * (oficina-saga-events.fifo, provisionado em oficina-messaging-infra).
 * MessageGroupId = correlationId garante ordem de entrega por OS;
 * MessageDeduplicationId = eventId evita duplicacao em caso de retry.
 */
export class SnsPublisherService implements SagaPublisher {
  private readonly logger = new Logger(SnsPublisherService.name);
  private readonly client: SNSClient;

  constructor(
    private readonly topicArn: string = process.env.SAGA_TOPIC_ARN || '',
    region: string = process.env.AWS_REGION || 'us-east-1',
  ) {
    this.client = new SNSClient({ region });
  }

  async publicar(
    eventType: string,
    payload: Record<string, unknown>,
    correlationId: string,
  ): Promise<void> {
    if (!this.topicArn) {
      // Sem topico configurado (ex: ambiente de dev local) - no-op silencioso,
      // nao bloqueia o fluxo principal da aplicacao.
      return;
    }

    const eventId = randomUUID();
    const envelope = {
      eventId,
      eventType,
      eventVersion: '1.0',
      occurredAt: new Date().toISOString(),
      correlationId,
      payload,
    };

    await this.client.send(
      new PublishCommand({
        TopicArn: this.topicArn,
        Message: JSON.stringify(envelope),
        MessageGroupId: correlationId,
        MessageDeduplicationId: eventId,
        MessageAttributes: {
          eventType: {
            DataType: 'String',
            StringValue: eventType,
          },
        },
      }),
    );

    this.logger.log(
      { correlationId, eventType, eventId },
      'Evento do Saga publicado',
    );
  }
}
