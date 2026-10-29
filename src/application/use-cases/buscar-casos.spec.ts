import { Cliente } from '../../domain/entities/cliente';
import { OrdemServico } from '../../domain/entities/ordem-servico';
import { Peca } from '../../domain/entities/peca';
import { Servico } from '../../domain/entities/servico';
import { Veiculo } from '../../domain/entities/veiculo';
import { InMemoryOrdemRepository } from '../../infraestructure/in-memory-ordem-repository';
import { BuscarCliente } from './buscar-cliente';
import { BuscarOrdemServico } from './buscar-ordem-servico';
import { BuscarPeca } from './buscar-peca';
import { BuscarServico } from './buscar-servico';
import { BuscarVeiculo } from './buscar-veiculo';

describe('Use-cases de busca', () => {
  it('deve buscar cliente quando informado e falhar quando ausente', () => {
    const useCase = new BuscarCliente();
    const cliente = new Cliente('c1', 'Maria', '12345678901');

    expect(useCase.execute(cliente)).toBe(cliente);
    expect(() => useCase.execute(undefined)).toThrow('Cliente não encontrado');
  });

  it('deve buscar veiculo quando informado e falhar quando ausente', () => {
    const useCase = new BuscarVeiculo();
    const veiculo = new Veiculo('v1', 'ABC1D23', 'Onix', 'Chevrolet', 2022);

    expect(useCase.execute(veiculo)).toBe(veiculo);
    expect(() => useCase.execute(undefined)).toThrow('Veículo não encontrado');
  });

  it('deve buscar servico quando informado e falhar quando ausente', () => {
    const useCase = new BuscarServico();
    const servico = new Servico('s1', 'Alinhamento', 150);

    expect(useCase.execute(servico)).toBe(servico);
    expect(() => useCase.execute(undefined)).toThrow('Serviço não encontrado');
  });

  it('deve buscar peca quando informada e falhar quando ausente', () => {
    const useCase = new BuscarPeca();
    const peca = new Peca('p1', 'Filtro', 25, 5);

    expect(useCase.execute(peca)).toBe(peca);
    expect(() => useCase.execute(undefined)).toThrow('Peça não encontrada');
  });

  it('deve buscar OS por id e falhar para id inexistente', async () => {
    const repo = new InMemoryOrdemRepository();
    const useCase = new BuscarOrdemServico(repo);
    const os = new OrdemServico('os-1');
    await repo.save(os);

    expect(await useCase.execute('os-1')).toBe(os);
    await expect(useCase.execute('nao-existe')).rejects.toThrow(
      'OS não encontrada',
    );
  });
});
