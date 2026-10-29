import {
  OrdemServico,
  StatusOrdemServico,
} from '../../domain/entities/ordem-servico';
import { InMemoryOrdemRepository } from '../../infraestructure/in-memory-ordem-repository';
import { ListarOrdensServico } from './listar-ordens-servico';

function criarOS(
  id: string,
  status: StatusOrdemServico,
  criadaEmMs: number,
): OrdemServico {
  const os = OrdemServico.reconstitute(
    id,
    'cli',
    'vei',
    status,
    [],
    0,
    new Date(criadaEmMs),
  );
  return os;
}

describe('ListarOrdensServico', () => {
  it('deve ocultar OS com status FINALIZADA e ENTREGUE', async () => {
    const repo = new InMemoryOrdemRepository();
    await repo.save(criarOS('os-1', 'RECEBIDA', 1000));
    await repo.save(criarOS('os-2', 'FINALIZADA', 2000));
    await repo.save(criarOS('os-3', 'ENTREGUE', 3000));

    const useCase = new ListarOrdensServico(repo);
    const resultado = await useCase.execute();

    expect(resultado).toHaveLength(1);
    expect(resultado[0].id).toBe('os-1');
  });

  it('deve ordenar por prioridade de status (EM_EXECUCAO > APROVADA > AGUARDANDO > EM_DIAGNOSTICO > RECEBIDA)', async () => {
    const repo = new InMemoryOrdemRepository();
    await repo.save(criarOS('os-r', 'RECEBIDA', 1000));
    await repo.save(criarOS('os-d', 'EM_DIAGNOSTICO', 1000));
    await repo.save(criarOS('os-a', 'AGUARDANDO_APROVACAO', 1000));
    await repo.save(criarOS('os-ap', 'APROVADA', 1000));
    await repo.save(criarOS('os-e', 'EM_EXECUCAO', 1000));

    const useCase = new ListarOrdensServico(repo);
    const resultado = await useCase.execute();

    const ids = resultado.map((os) => os.id);
    expect(ids).toEqual(['os-e', 'os-ap', 'os-a', 'os-d', 'os-r']);
  });

  it('deve desempatar por criadaEm ASC dentro do mesmo status', async () => {
    const repo = new InMemoryOrdemRepository();
    await repo.save(criarOS('os-nova', 'RECEBIDA', 3000));
    await repo.save(criarOS('os-antiga', 'RECEBIDA', 1000));
    await repo.save(criarOS('os-media', 'RECEBIDA', 2000));

    const useCase = new ListarOrdensServico(repo);
    const resultado = await useCase.execute();

    const ids = resultado.map((os) => os.id);
    expect(ids).toEqual(['os-antiga', 'os-media', 'os-nova']);
  });

  it('deve retornar lista vazia quando nao houver OS visiveis', async () => {
    const repo = new InMemoryOrdemRepository();
    await repo.save(criarOS('os-1', 'FINALIZADA', 1000));
    await repo.save(criarOS('os-2', 'ENTREGUE', 2000));

    const useCase = new ListarOrdensServico(repo);
    const resultado = await useCase.execute();

    expect(resultado).toHaveLength(0);
  });
});
