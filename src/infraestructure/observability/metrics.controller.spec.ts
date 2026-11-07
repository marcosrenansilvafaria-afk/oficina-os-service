import { MetricsController } from './metrics.controller';
import { metricsRegistry } from './metrics-registry';

describe('MetricsController', () => {
  it('retorna o conteudo exportado pelo registry do Prometheus', async () => {
    const metricsSpy = jest
      .spyOn(metricsRegistry, 'metrics')
      .mockResolvedValue('metric_fake 1\n');
    const controller = new MetricsController();

    const output = await controller.metrics();

    expect(metricsSpy).toHaveBeenCalledTimes(1);
    expect(output).toBe('metric_fake 1\n');
  });
});
