/**
 * Porta (Clean Architecture) para publicar eventos do Saga coreografado da
 * Fase 4. A camada de aplicação só conhece este contrato; a infraestrutura
 * fornece a implementação concreta (SNS FIFO, ver infraestructure/saga/).
 */
export interface SagaPublisher {
  publicar(
    eventType: string,
    payload: Record<string, unknown>,
    correlationId: string,
  ): Promise<void>;
}
