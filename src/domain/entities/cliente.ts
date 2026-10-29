export class Cliente {
  constructor(
    public readonly id: string,
    public nome: string,
    public documento: string, // CPF/CNPJ simplificado
  ) {}
}
