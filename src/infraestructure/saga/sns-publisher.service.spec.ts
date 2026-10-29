import { SnsPublisherService } from './sns-publisher.service';

interface PublishCommandInput {
  TopicArn?: string;
  Message?: string;
  MessageGroupId?: string;
  MessageDeduplicationId?: string;
  MessageAttributes?: { eventType?: { StringValue?: string } };
}

const sendMock = jest.fn<Promise<unknown>, [PublishCommandInput]>();
sendMock.mockResolvedValue({});

jest.mock('@aws-sdk/client-sns', () => ({
  SNSClient: jest.fn().mockImplementation(() => ({ send: sendMock })),
  PublishCommand: jest
    .fn()
    .mockImplementation((input: PublishCommandInput) => input),
}));

describe('SnsPublisherService', () => {
  beforeEach(() => {
    sendMock.mockClear();
  });

  it('nao publica quando nenhum topico esta configurado (dev local)', async () => {
    const service = new SnsPublisherService('');

    await service.publicar('OSCriadaEvent', { ordemServicoId: 'os-1' }, 'os-1');

    expect(sendMock).not.toHaveBeenCalled();
  });

  it('publica o evento com MessageGroupId e MessageDeduplicationId corretos', async () => {
    const service = new SnsPublisherService(
      'arn:aws:sns:us-east-1:123:topic.fifo',
    );

    await service.publicar(
      'OrcamentoGeradoEvent',
      { ordemServicoId: 'os-1', valorTotal: 150 },
      'os-1',
    );

    expect(sendMock).toHaveBeenCalledTimes(1);
    const input = sendMock.mock.calls[0][0];
    expect(input.TopicArn).toBe('arn:aws:sns:us-east-1:123:topic.fifo');
    expect(input.MessageGroupId).toBe('os-1');
    expect(input.MessageAttributes?.eventType?.StringValue).toBe(
      'OrcamentoGeradoEvent',
    );

    const envelope = JSON.parse(input.Message ?? '{}') as {
      eventId: string;
      eventType: string;
      correlationId: string;
      payload: unknown;
    };
    expect(envelope.eventType).toBe('OrcamentoGeradoEvent');
    expect(envelope.correlationId).toBe('os-1');
    expect(envelope.payload).toEqual({
      ordemServicoId: 'os-1',
      valorTotal: 150,
    });
    expect(input.MessageDeduplicationId).toBe(envelope.eventId);
  });
});
