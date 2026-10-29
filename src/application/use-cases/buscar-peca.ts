import { Peca } from '../../domain/entities/peca';

export class BuscarPeca {
  execute(peca?: Peca) {
    if (!peca) throw new Error('Peça não encontrada');
    return peca;
  }
}
