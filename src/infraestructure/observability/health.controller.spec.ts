import { HealthCheckService, HealthCheckError } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  it('reporta "up" quando a query de teste no banco funciona', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    const health = {
      check: jest.fn((indicators: Array<() => unknown>) =>
        Promise.all(indicators.map((fn) => fn())),
      ),
    };
    const controller = new HealthController(
      health as unknown as HealthCheckService,
      prisma as unknown as PrismaService,
    );

    const result = await controller.check();

    expect(result).toEqual([{ database: { status: 'up' } }]);
  });

  it('propaga HealthCheckError quando a query ao banco falha', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('conexao recusada')),
    };
    const health = {
      check: jest.fn((indicators: Array<() => unknown>) =>
        Promise.all(indicators.map((fn) => fn())),
      ),
    };
    const controller = new HealthController(
      health as unknown as HealthCheckService,
      prisma as unknown as PrismaService,
    );

    await expect(controller.check()).rejects.toBeInstanceOf(HealthCheckError);
  });
});
