import { InMemoryClienteRepository } from './in-memory-cliente-repository';
import { InMemoryVeiculoRepository } from './in-memory-veiculo-repository';
import { InMemoryOrdemRepository } from './in-memory-ordem-repository';
import { InMemoryServicoRepository } from './in-memory-servico-repository';
import { InMemoryPecaRepository } from './in-memory-peca-repository';
import { InMemoryHistoricoStatusRepository } from './in-memory-historico-status-repository';
import { PrismaClienteRepository } from './repositories/prisma-cliente.repository';
import { PrismaVeiculoRepository } from './repositories/prisma-veiculo.repository';
import { PrismaServicoRepository } from './repositories/prisma-servico.repository';
import { PrismaPecaRepository } from './repositories/prisma-peca.repository';
import { PrismaOrdemRepository } from './repositories/prisma-ordem.repository';
import { PrismaHistoricoStatusRepository } from './repositories/prisma-historico-status.repository';
import { PrismaService } from './prisma/prisma.service';
import { ConsoleEmailNotificador } from './notificacao/console-email-notificador';
import { SnsPublisherService } from './saga/sns-publisher.service';
import { SagaPublisher } from '../application/ports/saga-publisher';
import { IClienteRepository } from '../domain/repositories/cliente-repository.interface';
import { IVeiculoRepository } from '../domain/repositories/veiculo-repository.interface';
import { IOrdemRepository } from '../domain/repositories/ordem-repository.interface';
import { IServicoRepository } from '../domain/repositories/servico-repository.interface';
import { IPecaRepository } from '../domain/repositories/peca-repository.interface';
import { IHistoricoStatusRepository } from '../domain/repositories/historico-status-repository.interface';
import { NotificadorStatus } from '../application/ports/notificador-status';
import { Cliente } from '../domain/entities/cliente';
import { Veiculo } from '../domain/entities/veiculo';
import { Servico } from '../domain/entities/servico';
import { Peca } from '../domain/entities/peca';

// Implementações padrão: in-memory (usadas pelos testes unitários, sem dependência de banco).
// Em runtime, `useDatabaseRepositories()` troca para as implementações Prisma no bootstrap.
export let clienteRepo: IClienteRepository = new InMemoryClienteRepository();
export let veiculoRepo: IVeiculoRepository = new InMemoryVeiculoRepository();
export let ordemRepo: IOrdemRepository = new InMemoryOrdemRepository();
export let servicoRepo: IServicoRepository = new InMemoryServicoRepository();
export let pecaRepo: IPecaRepository = new InMemoryPecaRepository();
export let historicoStatusRepo: IHistoricoStatusRepository =
  new InMemoryHistoricoStatusRepository();

// Notificador de mudança de status (simulação de e-mail).
export const notificadorStatus: NotificadorStatus =
  new ConsoleEmailNotificador();

// Publisher do Saga coreografado (SNS FIFO, ver infraestructure/saga/).
export const sagaPublisher: SagaPublisher = new SnsPublisherService();

/**
 * Substitui os repositórios in-memory pelas implementações Prisma.
 * Deve ser chamado no bootstrap (`main.ts`) ANTES de `NestFactory.create`,
 * para que os controllers capturem as instâncias persistentes ao serem construídos.
 */
export function useDatabaseRepositories(prisma: PrismaService) {
  clienteRepo = new PrismaClienteRepository(prisma);
  veiculoRepo = new PrismaVeiculoRepository(prisma);
  ordemRepo = new PrismaOrdemRepository(prisma);
  servicoRepo = new PrismaServicoRepository(prisma);
  pecaRepo = new PrismaPecaRepository(prisma);
  historicoStatusRepo = new PrismaHistoricoStatusRepository(prisma);
}

export async function seedRepositories() {
  if (!(await clienteRepo.getById('cli-001'))) {
    await clienteRepo.save(
      new Cliente('cli-001', 'Cliente Demo', '12345678901'),
    );
  }

  if (!(await veiculoRepo.getById('vei-001'))) {
    await veiculoRepo.save(
      new Veiculo('vei-001', 'ABC1D23', 'Civic', 'Honda', 2022),
    );
  }

  if (!(await servicoRepo.getById('srv-001'))) {
    await servicoRepo.save(new Servico('srv-001', 'Troca de óleo', 100));
  }

  if (!(await pecaRepo.getById('pec-001'))) {
    await pecaRepo.save(new Peca('pec-001', 'Filtro de óleo', 35.9, 10));
  }
}

export async function resetInMemoryRepositories() {
  await clienteRepo.clear();
  await veiculoRepo.clear();
  await ordemRepo.clear();
  await servicoRepo.clear();
  await pecaRepo.clear();
  await historicoStatusRepo.clear();
}
