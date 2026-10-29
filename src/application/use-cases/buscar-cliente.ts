import { Cliente } from '../../domain/entities/cliente';

export class BuscarCliente {
  execute(cliente?: Cliente) {
    if (!cliente) throw new Error('Cliente não encontrado');
    return cliente;
  }
}
