export class ItemOrdemServico {
  constructor(
    public readonly tipo: 'SERVICO' | 'PECA',
    public readonly descricao: string,
    public readonly preco: number,
    public readonly quantidade: number,
  ) {}

  total(): number {
    return this.preco * this.quantidade;
  }
}
