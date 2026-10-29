import { ItemOrdemServico } from './item-ordem-servico';

describe('ItemOrdemServico', () => {
  it('deve calcular total como preco * quantidade', () => {
    const item = new ItemOrdemServico('SERVICO', 'Troca de oleo', 120, 2);

    expect(item.total()).toBe(240);
  });

  it('deve retornar 0 quando quantidade for 0', () => {
    const item = new ItemOrdemServico('PECA', 'Filtro', 50, 0);

    expect(item.total()).toBe(0);
  });
});
