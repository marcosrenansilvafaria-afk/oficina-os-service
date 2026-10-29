import {
  UseGuards,
  Controller,
  Post,
  Body,
  Get,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CriarVeiculo } from '../../application/use-cases/criar-veiculo';
import { BuscarVeiculo } from '../../application/use-cases/buscar-veiculo';
import { veiculoRepo } from '../../infraestructure/singletons';
import { CriarVeiculoDto } from './dto/veiculo.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { getErrorMessage } from './error-message';

@Controller('veiculos')
@ApiTags('veiculos')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
export class VeiculoController {
  private criarVeiculo = new CriarVeiculo(veiculoRepo);
  private buscarVeiculo = new BuscarVeiculo();
  private repo = veiculoRepo;

  private validarPlaca(placa: string) {
    const placaNormalizada = String(placa || '')
      .trim()
      .toUpperCase();
    const padraoMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
    const padraoAntigo = /^[A-Z]{3}-?[0-9]{4}$/;

    if (
      !padraoMercosul.test(placaNormalizada) &&
      !padraoAntigo.test(placaNormalizada)
    ) {
      throw new BadRequestException('placa inválida');
    }

    return placaNormalizada;
  }

  @ApiOperation({ summary: 'Criar veiculo' })
  @ApiBody({ type: CriarVeiculoDto })
  @ApiOkResponse({ description: 'Veiculo criado com sucesso' })
  @Post()
  async criar(@Body() body: CriarVeiculoDto) {
    if (!body || !body.placa || !body.modelo || !body.marca || !body.ano) {
      throw new BadRequestException(
        'placa, modelo, marca e ano são obrigatórios',
      );
    }

    try {
      const placa = this.validarPlaca(body.placa);
      return await this.criarVeiculo.execute({
        placa,
        modelo: body.modelo,
        marca: body.marca,
        ano: Number(body.ano),
      });
    } catch (err: unknown) {
      throw new BadRequestException(getErrorMessage(err));
    }
  }

  @ApiOperation({ summary: 'Buscar veiculo por id' })
  @ApiParam({ name: 'id', description: 'Id do veiculo' })
  @ApiOkResponse({ description: 'Veiculo encontrado' })
  @ApiNotFoundResponse({ description: 'Veículo não encontrado' })
  @Get(':id')
  async buscar(@Param('id') id: string) {
    const veiculo = await this.repo.getById(id);
    if (!veiculo) throw new NotFoundException('Veículo não encontrado');
    return this.buscarVeiculo.execute(veiculo);
  }

  @ApiOperation({ summary: 'Listar veiculos' })
  @ApiOkResponse({ description: 'Lista de veiculos retornada com sucesso' })
  @Get()
  async listar() {
    return this.repo.all();
  }
}
