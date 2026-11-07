import { PrismaVeiculoRepository } from './prisma-veiculo.repository';
import { Veiculo } from '../../domain/entities/veiculo';
import { PrismaService } from '../prisma/prisma.service';

function buildPrismaMock() {
  return {
    veiculo: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
}

function buildRepo(prisma: ReturnType<typeof buildPrismaMock>) {
  return new PrismaVeiculoRepository(prisma as unknown as PrismaService);
}

describe('PrismaVeiculoRepository', () => {
  it('save() faz upsert com todos os campos', async () => {
    const prisma = buildPrismaMock();
    const repo = buildRepo(prisma);
    const veiculo = new Veiculo('v1', 'ABC1234', 'Civic', 'Honda', 2020);

    await repo.save(veiculo);

    expect(prisma.veiculo.upsert).toHaveBeenCalledWith({
      where: { id: 'v1' },
      update: { placa: 'ABC1234', modelo: 'Civic', marca: 'Honda', ano: 2020 },
      create: {
        id: 'v1',
        placa: 'ABC1234',
        modelo: 'Civic',
        marca: 'Honda',
        ano: 2020,
      },
    });
  });

  it('getById() retorna null quando o registro nao existe', async () => {
    const prisma = buildPrismaMock();
    prisma.veiculo.findUnique.mockResolvedValue(null);
    const repo = buildRepo(prisma);

    expect(await repo.getById('inexistente')).toBeNull();
  });

  it('getById() mapeia o registro para a entidade Veiculo', async () => {
    const prisma = buildPrismaMock();
    prisma.veiculo.findUnique.mockResolvedValue({
      id: 'v1',
      placa: 'ABC1234',
      modelo: 'Civic',
      marca: 'Honda',
      ano: 2020,
    });
    const repo = buildRepo(prisma);

    const veiculo = await repo.getById('v1');

    expect(veiculo).toBeInstanceOf(Veiculo);
    expect(veiculo?.placa).toBe('ABC1234');
  });

  it('all() mapeia todos os registros', async () => {
    const prisma = buildPrismaMock();
    prisma.veiculo.findMany.mockResolvedValue([
      {
        id: 'v1',
        placa: 'ABC1234',
        modelo: 'Civic',
        marca: 'Honda',
        ano: 2020,
      },
    ]);
    const repo = buildRepo(prisma);

    const veiculos = await repo.all();

    expect(veiculos).toHaveLength(1);
    expect(veiculos[0].marca).toBe('Honda');
  });

  it('clear() remove todos os registros', async () => {
    const prisma = buildPrismaMock();
    const repo = buildRepo(prisma);

    await repo.clear();

    expect(prisma.veiculo.deleteMany).toHaveBeenCalled();
  });
});
