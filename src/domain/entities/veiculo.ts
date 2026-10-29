export class Veiculo {
  constructor(
    public readonly id: string,
    public placa: string,
    public modelo: string,
    public marca: string,
    public ano: number,
  ) {}
}
