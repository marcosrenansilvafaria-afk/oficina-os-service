import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClienteController } from './cliente.controller';
import { resetInMemoryRepositories } from '../../infraestructure/singletons';
import { CriarClienteDto } from './dto/cliente.dto';

describe('ClienteController', () => {
  beforeEach(async () => {
    await resetInMemoryRepositories();
  });

  it('deve validar campos obrigatorios no criar', async () => {
    const controller = new ClienteController();

    await expect(
      controller.criar({ nome: 'Ana' } as CriarClienteDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve rejeitar documento invalido', async () => {
    const controller = new ClienteController();

    await expect(
      controller.criar({ nome: 'Ana', documento: '123' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve criar cliente com documento normalizado e listar', async () => {
    const controller = new ClienteController();

    const created = await controller.criar({
      nome: 'Ana',
      documento: '123.456.789-01',
    });

    expect(created.documento).toBe('12345678901');
    expect(await controller.listar()).toHaveLength(1);
  });

  it('deve rejeitar duplicidade de documento', async () => {
    const controller = new ClienteController();

    await controller.criar({
      nome: 'Ana',
      documento: '12345678901',
    });

    await expect(
      controller.criar({
        nome: 'Ana 2',
        documento: '123.456.789-01',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve buscar cliente existente e falhar para id ausente', async () => {
    const controller = new ClienteController();

    const created = await controller.criar({
      nome: 'Ana',
      documento: '12345678901',
    });

    expect((await controller.buscar(created.id)).id).toBe(created.id);
    await expect(controller.buscar('inexistente')).rejects.toThrow(
      NotFoundException,
    );
  });
});
