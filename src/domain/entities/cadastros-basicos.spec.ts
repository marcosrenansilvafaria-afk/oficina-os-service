import { Cliente } from './cliente';
import { Servico } from './servico';
import { Veiculo } from './veiculo';

describe('Entidades basicas de cadastro', () => {
  it('deve instanciar Cliente com atributos esperados', () => {
    const cliente = new Cliente('c1', 'Maria', '12345678901');

    expect(cliente.id).toBe('c1');
    expect(cliente.nome).toBe('Maria');
    expect(cliente.documento).toBe('12345678901');
  });

  it('deve instanciar Veiculo com atributos esperados', () => {
    const veiculo = new Veiculo('v1', 'ABC1D23', 'Onix', 'Chevrolet', 2022);

    expect(veiculo.id).toBe('v1');
    expect(veiculo.placa).toBe('ABC1D23');
    expect(veiculo.modelo).toBe('Onix');
    expect(veiculo.marca).toBe('Chevrolet');
    expect(veiculo.ano).toBe(2022);
  });

  it('deve instanciar Servico com atributos esperados', () => {
    const servico = new Servico('s1', 'Troca de oleo', 120);

    expect(servico.id).toBe('s1');
    expect(servico.nome).toBe('Troca de oleo');
    expect(servico.preco).toBe(120);
  });
});
