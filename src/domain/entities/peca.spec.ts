import { Peca } from './peca';

describe('Peca', () => {
  it('deve iniciar com estoque padrao 0 quando nao informado', () => {
    const peca = new Peca('p1', 'Filtro', 35);

    expect(peca.estoque).toBe(0);
  });

  it('deve ajustar estoque com delta positivo e negativo valido', () => {
    const peca = new Peca('p1', 'Filtro', 35, 10);

    peca.ajustarEstoque(5);
    expect(peca.estoque).toBe(15);

    peca.ajustarEstoque(-3);
    expect(peca.estoque).toBe(12);
  });

  it('deve impedir estoque negativo', () => {
    const peca = new Peca('p1', 'Filtro', 35, 2);

    expect(() => peca.ajustarEstoque(-3)).toThrow('Estoque insuficiente');
    expect(peca.estoque).toBe(2);
  });
});
