import { PrismaOrdemRepository } from './prisma-ordem.repository';
import { OrdemServico } from '../../domain/entities/ordem-servico';
import { ItemOrdemServico } from '../../domain/entities/item-ordem-servico';
import { PrismaService } from '../prisma/prisma.service';

interface UpsertArg {
  where: { id: string };
  create: { clienteId: string | null; veiculoId: string | null };
}
interface CreateManyArg {
  data: Array<{ ordemServicoId: string; descricao: string }>;
}

function buildPrismaMock() {
  return {
    ordemServico: {
      upsert: jest.fn<Promise<void>, [UpsertArg]>(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    itemOrdemServico: {
      deleteMany: jest.fn(),
      createMany: jest.fn<Promise<void>, [CreateManyArg]>(),
    },
  };
}

function buildRepo(prisma: ReturnType<typeof buildPrismaMock>) {
  return new PrismaOrdemRepository(prisma as unknown as PrismaService);
}

describe('PrismaOrdemRepository', () => {
  it('save() faz upsert da OS, apaga os itens antigos e recria os atuais', async () => {
    const prisma = buildPrismaMock();
    const repo = buildRepo(prisma);
    const os = OrdemServico.reconstitute(
      'os-1',
      'cliente-1',
      'veiculo-1',
      'EM_DIAGNOSTICO',
      [new ItemOrdemServico('SERVICO', 'Troca de oleo', 100, 1)],
      100,
      new Date(),
      undefined,
    );

    await repo.save(os);

    const upsertArg = prisma.ordemServico.upsert.mock.calls[0][0];
    expect(upsertArg.where).toEqual({ id: 'os-1' });
    expect(upsertArg.create.clienteId).toBe('cliente-1');

    expect(prisma.itemOrdemServico.deleteMany).toHaveBeenCalledWith({
      where: { ordemServicoId: 'os-1' },
    });

    const createManyArg = prisma.itemOrdemServico.createMany.mock.calls[0][0];
    expect(createManyArg.data[0].ordemServicoId).toBe('os-1');
    expect(createManyArg.data[0].descricao).toBe('Troca de oleo');
  });

  it('save() nao chama createMany quando a OS nao tem itens', async () => {
    const prisma = buildPrismaMock();
    const repo = buildRepo(prisma);
    const os = OrdemServico.reconstitute(
      'os-2',
      undefined,
      undefined,
      'RECEBIDA',
      [],
      0,
      new Date(),
      undefined,
    );

    await repo.save(os);

    const upsertArg = prisma.ordemServico.upsert.mock.calls[0][0];
    expect(upsertArg.create.clienteId).toBeNull();
    expect(upsertArg.create.veiculoId).toBeNull();
    expect(prisma.itemOrdemServico.createMany).not.toHaveBeenCalled();
  });

  it('getById() retorna null quando o registro nao existe', async () => {
    const prisma = buildPrismaMock();
    prisma.ordemServico.findUnique.mockResolvedValue(null);
    const repo = buildRepo(prisma);

    expect(await repo.getById('inexistente')).toBeNull();
  });

  it('getById() reconstitui a entidade com itens a partir do registro', async () => {
    const prisma = buildPrismaMock();
    prisma.ordemServico.findUnique.mockResolvedValue({
      id: 'os-1',
      clienteId: null,
      veiculoId: null,
      status: 'APROVADA',
      valorTotal: 150,
      criadaEm: new Date(),
      finalizadaEm: null,
      itens: [{ tipo: 'PECA', descricao: 'Filtro', preco: 50, quantidade: 1 }],
    });
    const repo = buildRepo(prisma);

    const os = await repo.getById('os-1');

    expect(os).toBeInstanceOf(OrdemServico);
    expect(os?.getStatus()).toBe('APROVADA');
    expect(os?.getItens()).toHaveLength(1);
  });

  it('exists() delega para count()', async () => {
    const prisma = buildPrismaMock();
    prisma.ordemServico.count.mockResolvedValue(1);
    const repo = buildRepo(prisma);

    expect(await repo.exists('os-1')).toBe(true);
  });

  it('all() mapeia todos os registros com seus itens', async () => {
    const prisma = buildPrismaMock();
    prisma.ordemServico.findMany.mockResolvedValue([
      {
        id: 'os-1',
        clienteId: null,
        veiculoId: null,
        status: 'RECEBIDA',
        valorTotal: 0,
        criadaEm: new Date(),
        finalizadaEm: null,
        itens: [],
      },
    ]);
    const repo = buildRepo(prisma);

    expect(await repo.all()).toHaveLength(1);
  });

  it('clear() remove itens e ordens de servico', async () => {
    const prisma = buildPrismaMock();
    const repo = buildRepo(prisma);

    await repo.clear();

    expect(prisma.itemOrdemServico.deleteMany).toHaveBeenCalled();
    expect(prisma.ordemServico.deleteMany).toHaveBeenCalled();
  });
});
