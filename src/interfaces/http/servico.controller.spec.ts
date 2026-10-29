import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ServicoController } from './servico.controller';
import { resetInMemoryRepositories } from '../../infraestructure/singletons';
import { CriarServicoDto } from './dto/servico.dto';

describe('ServicoController', () => {
  beforeEach(async () => {
    await resetInMemoryRepositories();
  });

  it('deve validar nome obrigatorio no criar', async () => {
    const controller = new ServicoController();

    await expect(
      controller.criar({ preco: 120 } as CriarServicoDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve criar, listar e buscar servico existente', async () => {
    const controller = new ServicoController();

    const created = await controller.criar({
      nome: 'Troca de oleo',
      preco: 150,
    });

    expect(await controller.listar()).toHaveLength(1);
    expect((await controller.buscar(created.id)).id).toBe(created.id);
  });

  it('deve retornar not found ao buscar servico inexistente', async () => {
    const controller = new ServicoController();

    await expect(controller.buscar('inexistente')).rejects.toThrow(
      NotFoundException,
    );
  });
});
