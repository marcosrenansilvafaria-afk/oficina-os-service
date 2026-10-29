import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PecaController } from './peca.controller';
import { resetInMemoryRepositories } from '../../infraestructure/singletons';
import { CriarPecaDto } from './dto/peca.dto';

describe('PecaController', () => {
  beforeEach(async () => {
    await resetInMemoryRepositories();
  });

  it('deve validar nome obrigatorio no criar', async () => {
    const controller = new PecaController();

    await expect(
      controller.criar({ preco: 10, estoque: 1 } as CriarPecaDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve criar, listar e buscar peca existente', async () => {
    const controller = new PecaController();

    const created = await controller.criar({
      nome: 'Filtro de oleo',
      preco: 45.9,
      estoque: 3,
    });

    expect(await controller.listar()).toHaveLength(1);
    expect((await controller.buscar(created.id)).id).toBe(created.id);
  });

  it('deve retornar not found ao buscar peca inexistente', async () => {
    const controller = new PecaController();

    await expect(controller.buscar('inexistente')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deve ajustar estoque com sucesso', async () => {
    const controller = new PecaController();

    const created = await controller.criar({
      nome: 'Pastilha de freio',
      preco: 120,
      estoque: 5,
    });

    const ajustada = await controller.ajustar(created.id, {
      delta: -2,
    });

    expect(ajustada.estoque).toBe(3);
  });

  it('deve rejeitar delta invalido no ajuste', async () => {
    const controller = new PecaController();

    const created = await controller.criar({
      nome: 'Correia',
      preco: 90,
      estoque: 2,
    });

    await expect(
      controller.ajustar(created.id, {
        delta: Number.NaN,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve converter erro de regra em bad request no ajuste', async () => {
    const controller = new PecaController();

    const created = await controller.criar({
      nome: 'Bateria',
      preco: 380,
      estoque: 1,
    });

    await expect(
      controller.ajustar(created.id, {
        delta: -3,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
