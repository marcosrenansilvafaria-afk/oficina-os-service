import { Peca } from '../../domain/entities/peca';
import { Servico } from '../../domain/entities/servico';
import { InMemoryOrdemRepository } from '../../infraestructure/in-memory-ordem-repository';
import { InMemoryPecaRepository } from '../../infraestructure/in-memory-peca-repository';
import { InMemoryServicoRepository } from '../../infraestructure/in-memory-servico-repository';
import { CriarOrdemServico } from './criar-ordem-servico';
import { AdicionarItemOrdemServico } from './adicionar-item-ordem-servico';
import { IniciarDiagnostico } from './iniciar-diagnostico';

describe('AdicionarItemOrdemServico', () => {
  async function prepararOS() {
    const ordemRepo = new InMemoryOrdemRepository();
    const criar = new CriarOrdemServico(ordemRepo);
    const iniciarDiagnostico = new IniciarDiagnostico(ordemRepo);
    const os = await criar.execute();
    await iniciarDiagnostico.execute(os.id);
    return { ordemRepo, os };
  }

  it('deve adicionar item a partir de pecaId', async () => {
    const { ordemRepo, os } = await prepararOS();
    const pecaRepo = new InMemoryPecaRepository();
    const servicoRepo = new InMemoryServicoRepository();
    await pecaRepo.save(new Peca('p1', 'Filtro de oleo', 45, 10));

    const useCase = new AdicionarItemOrdemServico(
      ordemRepo,
      pecaRepo,
      servicoRepo,
    );
    const atualizado = await useCase.execute(os.id, {
      tipo: 'PECA',
      pecaId: 'p1',
      quantidade: 2,
    });

    expect(atualizado.getItens()).toHaveLength(1);
    expect(atualizado.getItens()[0].descricao).toBe('Filtro de oleo');
    expect(atualizado.getItens()[0].preco).toBe(45);
  });

  it('deve adicionar item a partir de servicoId', async () => {
    const { ordemRepo, os } = await prepararOS();
    const pecaRepo = new InMemoryPecaRepository();
    const servicoRepo = new InMemoryServicoRepository();
    await servicoRepo.save(new Servico('s1', 'Troca de oleo', 120));

    const useCase = new AdicionarItemOrdemServico(
      ordemRepo,
      pecaRepo,
      servicoRepo,
    );
    const atualizado = await useCase.execute(os.id, {
      tipo: 'SERVICO',
      servicoId: 's1',
      quantidade: 1,
    });

    expect(atualizado.getItens()).toHaveLength(1);
    expect(atualizado.getItens()[0].descricao).toBe('Troca de oleo');
    expect(atualizado.getItens()[0].preco).toBe(120);
  });

  it('deve falhar quando OS nao existe', async () => {
    const ordemRepo = new InMemoryOrdemRepository();
    const pecaRepo = new InMemoryPecaRepository();
    const servicoRepo = new InMemoryServicoRepository();
    const useCase = new AdicionarItemOrdemServico(
      ordemRepo,
      pecaRepo,
      servicoRepo,
    );

    await expect(
      useCase.execute('nao-existe', {
        tipo: 'SERVICO',
        descricao: 'x',
        preco: 1,
        quantidade: 1,
      }),
    ).rejects.toThrow('OS não encontrada');
  });

  it('deve falhar quando pecaId for invalido', async () => {
    const { ordemRepo, os } = await prepararOS();
    const pecaRepo = new InMemoryPecaRepository();
    const servicoRepo = new InMemoryServicoRepository();
    const useCase = new AdicionarItemOrdemServico(
      ordemRepo,
      pecaRepo,
      servicoRepo,
    );

    await expect(
      useCase.execute(os.id, {
        tipo: 'PECA',
        pecaId: 'invalido',
        quantidade: 1,
      }),
    ).rejects.toThrow('Peça não encontrada');
  });

  it('deve falhar quando descricao nao for resolvida', async () => {
    const { ordemRepo, os } = await prepararOS();
    const pecaRepo = new InMemoryPecaRepository();
    const servicoRepo = new InMemoryServicoRepository();
    const useCase = new AdicionarItemOrdemServico(
      ordemRepo,
      pecaRepo,
      servicoRepo,
    );

    await expect(
      useCase.execute(os.id, { tipo: 'SERVICO', quantidade: 1 }),
    ).rejects.toThrow('descricao é obrigatória');
  });
});
