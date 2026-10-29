import { Peca } from '../../domain/entities/peca';
import { InMemoryPecaRepository } from '../../infraestructure/in-memory-peca-repository';
import { AjustarEstoquePeca } from './ajustar-estoque-peca';

describe('AjustarEstoquePeca', () => {
  it('deve ajustar estoque quando peca existir', async () => {
    const repo = new InMemoryPecaRepository();
    const peca = new Peca('p1', 'Filtro', 20, 5);
    await repo.save(peca);

    const useCase = new AjustarEstoquePeca(repo);
    const atualizada = await useCase.execute('p1', -2);

    expect(atualizada.estoque).toBe(3);
  });

  it('deve falhar quando peca nao existe', async () => {
    const repo = new InMemoryPecaRepository();
    const useCase = new AjustarEstoquePeca(repo);

    await expect(useCase.execute('nao-existe', 1)).rejects.toThrow(
      'Peça não encontrada',
    );
  });

  it('deve falhar quando ajuste gerar estoque negativo', async () => {
    const repo = new InMemoryPecaRepository();
    await repo.save(new Peca('p1', 'Filtro', 20, 1));

    const useCase = new AjustarEstoquePeca(repo);
    await expect(useCase.execute('p1', -2)).rejects.toThrow(
      'Estoque insuficiente',
    );
  });
});
