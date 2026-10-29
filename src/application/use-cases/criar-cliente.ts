import { Cliente } from '../../domain/entities/cliente';
import { IClienteRepository } from '../../domain/repositories/cliente-repository.interface';
import { generateId } from '../../utils/id';

type Input = { nome: string; documento: string };

export class CriarCliente {
  constructor(private repo: IClienteRepository) {}

  async execute(input: Input) {
    const documento = String(input.documento).replace(/\D/g, '');

    if (documento.length !== 11 && documento.length !== 14) {
      throw new Error('documento inválido (esperado CPF/CNPJ)');
    }

    const todos = await this.repo.all();
    const exists = todos.some(
      (c) => String(c.documento).replace(/\D/g, '') === documento,
    );
    if (exists) throw new Error('Cliente com este documento já cadastrado');

    const cliente = new Cliente(generateId(), input.nome, documento);
    await this.repo.save(cliente);
    return cliente;
  }
}
