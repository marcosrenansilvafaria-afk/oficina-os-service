import { PrismaServicoRepository } from './prisma-servico.repository';
import { Servico } from '../../domain/entities/servico';
import { PrismaService } from '../prisma/prisma.service';

function buildPrismaMock() {
  return {
    servico: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
}

function buildRepo(prisma: ReturnType<typeof buildPrismaMock>) {
  return new PrismaServicoRepository(prisma as unknown as PrismaService);
}

describe('PrismaServicoRepository', () => {
  it('save() faz upsert com id/nome/preco', async () => {
    const prisma = buildPrismaMock();
    const repo = buildRepo(prisma);
    const servico = new Servico('s1', 'Troca de oleo', 120);

    await repo.save(servico);

    expect(prisma.servico.upsert).toHaveBeenCalledWith({
      where: { id: 's1' },
      update: { nome: 'Troca de oleo', preco: 120 },
      create: { id: 's1', nome: 'Troca de oleo', preco: 120 },
    });
  });

  it('getById() retorna null quando o registro nao existe', async () => {
    const prisma = buildPrismaMock();
    prisma.servico.findUnique.mockResolvedValue(null);
    const repo = buildRepo(prisma);

    expect(await repo.getById('inexistente')).toBeNull();
  });

  it('getById() mapeia o registro para a entidade Servico', async () => {
    const prisma = buildPrismaMock();
    prisma.servico.findUnique.mockResolvedValue({
      id: 's1',
      nome: 'Troca de oleo',
      preco: 120,
    });
    const repo = buildRepo(prisma);

    const servico = await repo.getById('s1');

    expect(servico).toBeInstanceOf(Servico);
    expect(servico?.preco).toBe(120);
  });

  it('all() mapeia todos os registros', async () => {
    const prisma = buildPrismaMock();
    prisma.servico.findMany.mockResolvedValue([
      { id: 's1', nome: 'Troca de oleo', preco: 120 },
    ]);
    const repo = buildRepo(prisma);

    expect(await repo.all()).toHaveLength(1);
  });

  it('clear() remove todos os registros', async () => {
    const prisma = buildPrismaMock();
    const repo = buildRepo(prisma);

    await repo.clear();

    expect(prisma.servico.deleteMany).toHaveBeenCalled();
  });
});
