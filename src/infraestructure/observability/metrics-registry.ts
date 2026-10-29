import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';

/**
 * Registro de metricas Prometheus. Singleton simples (mesmo padrao dos
 * repositorios em singletons.ts), sem depender do container de DI do Nest -
 * as metricas de negocio sao incrementadas diretamente pela camada HTTP e
 * pelos repositorios de infraestrutura.
 */
export const metricsRegistry = new Registry();
collectDefaultMetrics({ register: metricsRegistry });

export const ordensServicoCriadasTotal = new Counter({
  name: 'oficina_ordens_servico_created_total',
  help: 'Total de ordens de servico criadas (dashboard: volume diario de OS)',
  registers: [metricsRegistry],
});

export const ordemServicoStatusDuracaoSegundos = new Histogram({
  name: 'oficina_ordem_servico_status_duration_seconds',
  help: 'Duracao (segundos) que uma OS permaneceu em cada status antes de transicionar (dashboard: tempo medio de execucao por status)',
  labelNames: ['status'],
  buckets: [10, 30, 60, 300, 900, 3600, 21600, 86400],
  registers: [metricsRegistry],
});

export const integracaoErrosTotal = new Counter({
  name: 'oficina_integration_errors_total',
  help: 'Total de erros/falhas em integracoes externas (dashboard: taxa de erros e falhas em integracoes)',
  labelNames: ['integracao'],
  registers: [metricsRegistry],
});

export const httpRequestDuracaoSegundos = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duracao das requisicoes HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [metricsRegistry],
});
