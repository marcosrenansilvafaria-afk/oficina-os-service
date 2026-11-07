import { PrismaClienteRepository } from './prisma-cliente.repository';
import { Cliente } from '../../domain/entities/cliente';
import { PrismaService } from '../prisma/prisma.service';

function buildPrismaMock() {
  return {
    cliente: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
}

function buildRepo(prisma: ReturnType<typeof buildPrismaMock>) {
  return new PrismaClienteRepository(prisma as unknown as PrismaService);
}

describe('PrismaClienteRepository', () => {
  it('save() faz upsert com id/nome/documento', async () => {
    const prisma = buildPrismaMock();
    const repo = buildRepo(prisma);
    const cliente = new Cliente('c1', 'Joao', '123.456.789-00');

    await repo.save(cliente);

    expect(prisma.cliente.upsert).toHaveBeenCalledWith({
      where: { id: 'c1' },
      update: { nome: 'Joao', documento: '123.456.789-00' },
      create: { id: 'c1', nome: 'Joao', documento: '123.456.789-00' },
    });
  });

  it('getById() retorna null quando o registro nao existe', async () => {
    const prisma = buildPrismaMock();
    prisma.cliente.findUnique.mockResolvedValue(null);
    const repo = buildRepo(prisma);

    expect(await repo.getById('inexistente')).toBeNull();
  });

  it('getById() mapeia o registro para a entidade Cliente', async () => {
    const prisma = buildPrismaMock();
    prisma.cliente.findUnique.mockResolvedValue({
      id: 'c1',
      nome: 'Joao',
      documento: '123.456.789-00',
    });
    const repo = buildRepo(prisma);

    const cliente = await repo.getById('c1');

    expect(cliente).toBeInstanceOf(Cliente);
    expect(cliente?.nome).toBe('Joao');
  });

  it('all() mapeia todos os registros', async () => {
    const prisma = buildPrismaMock();
    prisma.cliente.findMany.mockResolvedValue([
      { id: 'c1', nome: 'Joao', documento: '1' },
      { id: 'c2', nome: 'Maria', documento: '2' },
    ]);
    const repo = buildRepo(prisma);

    const clientes = await repo.all();

    expect(clientes).toHaveLength(2);
    expect(clientes[1].nome).toBe('Maria');
  });

  it('clear() remove todos os registros', async () => {
    const prisma = buildPrismaMock();
    const repo = buildRepo(prisma);

    await repo.clear();

    expect(prisma.cliente.deleteMany).toHaveBeenCalled();
  });
});
