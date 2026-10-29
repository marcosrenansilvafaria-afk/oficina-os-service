import { InMemoryClienteRepository } from '../../infraestructure/in-memory-cliente-repository';
import { InMemoryPecaRepository } from '../../infraestructure/in-memory-peca-repository';
import { InMemoryServicoRepository } from '../../infraestructure/in-memory-servico-repository';
import { InMemoryVeiculoRepository } from '../../infraestructure/in-memory-veiculo-repository';
import { CriarCliente } from './criar-cliente';
import { CriarPeca } from './criar-peca';
import { CriarServico } from './criar-servico';
import { CriarVeiculo } from './criar-veiculo';

describe('Use-cases de cadastro', () => {
  it('deve criar cliente normalizando documento e impedindo duplicidade', async () => {
    const repo = new InMemoryClienteRepository();
    const useCase = new CriarCliente(repo);

    const cliente = await useCase.execute({
      nome: 'Ana',
      documento: '123.456.789-01',
    });

    expect(cliente.documento).toBe('12345678901');
    expect(await repo.getById(cliente.id)).toBeDefined();

    await expect(
      useCase.execute({ nome: 'Ana 2', documento: '12345678901' }),
    ).rejects.toThrow('Cliente com este documento já cadastrado');
  });

  it('deve falhar ao criar cliente com documento invalido', async () => {
    const repo = new InMemoryClienteRepository();
    const useCase = new CriarCliente(repo);

    await expect(
      useCase.execute({ nome: 'Ana', documento: '123' }),
    ).rejects.toThrow('documento inválido (esperado CPF/CNPJ)');
  });

  it('deve criar veiculo com input informado e com defaults quando ausente', async () => {
    const repo = new InMemoryVeiculoRepository();
    const useCase = new CriarVeiculo(repo);

    const comInput = await useCase.execute({
      placa: 'ABC1D23',
      modelo: 'Onix',
      marca: 'Chevrolet',
      ano: 2022,
    });
    const semInput = await useCase.execute();

    expect(comInput.placa).toBe('ABC1D23');
    expect(semInput.placa).toBe('');
    expect(semInput.ano).toBe(0);
  });

  it('deve criar servico e validar nome obrigatorio', async () => {
    const repo = new InMemoryServicoRepository();
    const useCase = new CriarServico(repo);

    const servico = await useCase.execute({ nome: 'Balanceamento', preco: 80 });
    expect(servico.nome).toBe('Balanceamento');

    await expect(useCase.execute({ nome: '', preco: 10 })).rejects.toThrow(
      'nome é obrigatório',
    );
  });

  it('deve criar peca com estoque default e validar nome obrigatorio', async () => {
    const repo = new InMemoryPecaRepository();
    const useCase = new CriarPeca(repo);

    const peca = await useCase.execute({ nome: 'Pastilha', preco: 120 });
    expect(peca.estoque).toBe(0);

    await expect(useCase.execute({ nome: '', preco: 10 })).rejects.toThrow(
      'nome é obrigatório',
    );
  });
});
