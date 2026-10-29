import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VeiculoController } from './veiculo.controller';
import { resetInMemoryRepositories } from '../../infraestructure/singletons';
import { CriarVeiculoDto } from './dto/veiculo.dto';

describe('VeiculoController', () => {
  beforeEach(async () => {
    await resetInMemoryRepositories();
  });

  it('deve validar campos obrigatorios', async () => {
    const controller = new VeiculoController();

    await expect(
      controller.criar({ placa: 'ABC1D23' } as CriarVeiculoDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve rejeitar placa invalida', async () => {
    const controller = new VeiculoController();

    await expect(
      controller.criar({
        placa: 'AAAA',
        modelo: 'Onix',
        marca: 'GM',
        ano: 2023,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve criar com placa normalizada e listar', async () => {
    const controller = new VeiculoController();

    const created = await controller.criar({
      placa: 'abc-1234',
      modelo: 'Onix',
      marca: 'GM',
      ano: 2023,
    });

    expect(created.placa).toBe('ABC-1234');
    expect(await controller.listar()).toHaveLength(1);
  });

  it('deve buscar veiculo existente e falhar para id ausente', async () => {
    const controller = new VeiculoController();

    const created = await controller.criar({
      placa: 'ABC1D23',
      modelo: 'Onix',
      marca: 'GM',
      ano: 2023,
    });

    expect((await controller.buscar(created.id)).id).toBe(created.id);
    await expect(controller.buscar('inexistente')).rejects.toThrow(
      NotFoundException,
    );
  });
});
