import { PrismaPecaRepository } from './prisma-peca.repository';
import { Peca } from '../../domain/entities/peca';
import { PrismaService } from '../prisma/prisma.service';

function buildPrismaMock() {
  return {
    peca: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
}

function buildRepo(prisma: ReturnType<typeof buildPrismaMock>) {
  return new PrismaPecaRepository(prisma as unknown as PrismaService);
}

describe('PrismaPecaRepository', () => {
  it('save() faz upsert com id/nome/preco/estoque', async () => {
    const prisma = buildPrismaMock();
    const repo = buildRepo(prisma);
    const peca = new Peca('p1', 'Filtro de oleo', 35, 10);

    await repo.save(peca);

    expect(prisma.peca.upsert).toHaveBeenCalledWith({
      where: { id: 'p1' },
      update: { nome: 'Filtro de oleo', preco: 35, estoque: 10 },
      create: { id: 'p1', nome: 'Filtro de oleo', preco: 35, estoque: 10 },
    });
  });

  it('getById() retorna null quando o registro nao existe', async () => {
    const prisma = buildPrismaMock();
    prisma.peca.findUnique.mockResolvedValue(null);
    const repo = buildRepo(prisma);

    expect(await repo.getById('inexistente')).toBeNull();
  });

  it('getById() mapeia o registro para a entidade Peca', async () => {
    const prisma = buildPrismaMock();
    prisma.peca.findUnique.mockResolvedValue({
      id: 'p1',
      nome: 'Filtro de oleo',
      preco: 35,
      estoque: 10,
    });
    const repo = buildRepo(prisma);

    const peca = await repo.getById('p1');

    expect(peca).toBeInstanceOf(Peca);
    expect(peca?.estoque).toBe(10);
  });

  it('all() mapeia todos os registros', async () => {
    const prisma = buildPrismaMock();
    prisma.peca.findMany.mockResolvedValue([
      { id: 'p1', nome: 'Filtro de oleo', preco: 35, estoque: 10 },
    ]);
    const repo = buildRepo(prisma);

    expect(await repo.all()).toHaveLength(1);
  });

  it('clear() remove todos os registros', async () => {
    const prisma = buildPrismaMock();
    const repo = buildRepo(prisma);

    await repo.clear();

    expect(prisma.peca.deleteMany).toHaveBeenCalled();
  });
});
