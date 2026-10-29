export class PrismaClient {
  constructor(_options?: unknown) {}
  $connect = jest.fn().mockResolvedValue(undefined);
  $disconnect = jest.fn().mockResolvedValue(undefined);
  cliente = {
    findUnique: jest.fn(), findMany: jest.fn(),
    upsert: jest.fn(), deleteMany: jest.fn(),
  };
  veiculo = {
    findUnique: jest.fn(), findMany: jest.fn(),
    upsert: jest.fn(), deleteMany: jest.fn(),
  };
  servico = {
    findUnique: jest.fn(), findMany: jest.fn(),
    upsert: jest.fn(), deleteMany: jest.fn(),
  };
  peca = {
    findUnique: jest.fn(), findMany: jest.fn(),
    upsert: jest.fn(), deleteMany: jest.fn(),
  };
  ordemServico = {
    findUnique: jest.fn(), findMany: jest.fn(),
    upsert: jest.fn(), deleteMany: jest.fn(),
  };
  itemOrdemServico = {
    createMany: jest.fn(), deleteMany: jest.fn(),
  };
}
