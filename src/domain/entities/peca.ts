export class Peca {
  constructor(
    public readonly id: string,
    public nome: string,
    public preco: number,
    public estoque: number = 0,
  ) {}

  ajustarEstoque(delta: number) {
    const novo = this.estoque + delta;
    if (novo < 0) throw new Error('Estoque insuficiente');
    this.estoque = novo;
  }
}
