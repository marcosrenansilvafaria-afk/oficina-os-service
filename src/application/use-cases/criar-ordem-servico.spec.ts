import { Cliente } from '../../domain/entities/cliente';
import { Veiculo } from '../../domain/entities/veiculo';
import { InMemoryClienteRepository } from '../../infraestructure/in-memory-cliente-repository';
import { InMemoryOrdemRepository } from '../../infraestructure/in-memory-ordem-repository';
import { InMemoryVeiculoRepository } from '../../infraestructure/in-memory-veiculo-repository';
import { CriarOrdemServico } from './criar-ordem-servico';

describe('CriarOrdemServico', () => {
  it('deve criar e salvar OS com status RECEBIDA', async () => {
    const ordemRepo = new InMemoryOrdemRepository();
    const useCase = new CriarOrdemServico(ordemRepo);

    const os = await useCase.execute();

    expect(os.id).toBeDefined();
    expect(os.getStatus()).toBe('RECEBIDA');
    expect(await ordemRepo.getById(os.id)).toBeDefined();
  });

  it('deve validar clienteId quando repositorio de clientes for informado', async () => {
    const ordemRepo = new InMemoryOrdemRepository();
    const clienteRepo = new InMemoryClienteRepository();
    const veiculoRepo = new InMemoryVeiculoRepository();

    const useCase = new CriarOrdemServico(ordemRepo, clienteRepo, veiculoRepo);

    await expect(useCase.execute({ clienteId: 'invalido' })).rejects.toThrow(
      'clienteId inválido',
    );

    await clienteRepo.save(new Cliente('c1', 'Joao', '12345678901'));
    const os = await useCase.execute({ clienteId: 'c1' });

    expect(os.clienteId).toBe('c1');
  });

  it('deve validar veiculoId quando repositorio de veiculos for informado', async () => {
    const ordemRepo = new InMemoryOrdemRepository();
    const clienteRepo = new InMemoryClienteRepository();
    const veiculoRepo = new InMemoryVeiculoRepository();

    const useCase = new CriarOrdemServico(ordemRepo, clienteRepo, veiculoRepo);

    await expect(useCase.execute({ veiculoId: 'invalido' })).rejects.toThrow(
      'veiculoId inválido',
    );

    await veiculoRepo.save(
      new Veiculo('v1', 'ABC1D23', 'Onix', 'Chevrolet', 2022),
    );
    const os = await useCase.execute({ veiculoId: 'v1' });

    expect(os.veiculoId).toBe('v1');
  });
});
