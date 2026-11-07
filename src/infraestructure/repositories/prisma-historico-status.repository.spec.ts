import { PrismaHistoricoStatusRepository } from './prisma-historico-status.repository';
import { PrismaService } from '../prisma/prisma.service';
import { ordemServicoStatusDuracaoSegundos } from '../observability/metrics-registry';

interface CreateArg {
  data: { ordemServicoId: string; status: string };
}

function buildPrismaMock() {
  return {
    ordemServicoStatusHistorico: {
      findFirst: jest.fn(),
      create: jest.fn<Promise<void>, [CreateArg]>(),
      deleteMany: jest.fn(),
    },
  };
}

function buildRepo(prisma: ReturnType<typeof buildPrismaMock>) {
  return new PrismaHistoricoStatusRepository(
    prisma as unknown as PrismaService,
  );
}

describe('PrismaHistoricoStatusRepository', () => {
  it('registrar() cria a transicao sem observar duracao quando nao ha historico anterior', async () => {
    const prisma = buildPrismaMock();
    prisma.ordemServicoStatusHistorico.findFirst.mockResolvedValue(null);
    const observeSpy = jest.spyOn(ordemServicoStatusDuracaoSegundos, 'observe');
    const repo = buildRepo(prisma);

    await repo.registrar('os-1', 'RECEBIDA');

    expect(observeSpy).not.toHaveBeenCalled();
    const createArg =
      prisma.ordemServicoStatusHistorico.create.mock.calls[0][0];
    expect(createArg.data.ordemServicoId).toBe('os-1');
    expect(createArg.data.status).toBe('RECEBIDA');
  });

  it('registrar() observa a duracao do status anterior quando existe historico', async () => {
    const prisma = buildPrismaMock();
    const alteradoEm = new Date(Date.now() - 5000);
    prisma.ordemServicoStatusHistorico.findFirst.mockResolvedValue({
      status: 'EM_DIAGNOSTICO',
      alteradoEm,
    });
    const observeSpy = jest.spyOn(ordemServicoStatusDuracaoSegundos, 'observe');
    const repo = buildRepo(prisma);

    await repo.registrar('os-1', 'AGUARDANDO_APROVACAO');

    expect(observeSpy).toHaveBeenCalledWith(
      { status: 'EM_DIAGNOSTICO' },
      expect.any(Number),
    );
  });

  it('clear() remove todos os registros', async () => {
    const prisma = buildPrismaMock();
    const repo = buildRepo(prisma);

    await repo.clear();

    expect(prisma.ordemServicoStatusHistorico.deleteMany).toHaveBeenCalled();
  });
});
