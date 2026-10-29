import {
  UseGuards,
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  BadRequestException,
  NotFoundException,
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
import { CriarPeca } from '../../application/use-cases/criar-peca';
import { BuscarPeca } from '../../application/use-cases/buscar-peca';
import { ListarPeca } from '../../application/use-cases/listar-peca';
import { AjustarEstoquePeca } from '../../application/use-cases/ajustar-estoque-peca';
import { pecaRepo } from '../../infraestructure/singletons';
import { AjustarEstoquePecaDto, CriarPecaDto } from './dto/peca.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { getErrorMessage } from './error-message';

@Controller('pecas')
@ApiTags('pecas')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
export class PecaController {
  private criarPeca = new CriarPeca(pecaRepo);
  private buscarPeca = new BuscarPeca();
  private listarPeca = new ListarPeca(pecaRepo);
  private ajustarEstoque = new AjustarEstoquePeca(pecaRepo);

  @ApiOperation({ summary: 'Criar peca' })
  @ApiBody({ type: CriarPecaDto })
  @ApiOkResponse({ description: 'Peça criada com sucesso' })
  @Post()
  async criar(@Body() body: CriarPecaDto) {
    try {
      return await this.criarPeca.execute({
        nome: body.nome,
        preco: body.preco,
        estoque: body.estoque,
      });
    } catch (err: unknown) {
      throw new BadRequestException(getErrorMessage(err));
    }
  }

  @ApiOperation({ summary: 'Buscar peca por id' })
  @ApiParam({ name: 'id', description: 'Id da peca' })
  @ApiOkResponse({ description: 'Peça encontrada' })
  @ApiNotFoundResponse({ description: 'Peça não encontrada' })
  @Get(':id')
  async buscar(@Param('id') id: string) {
    const p = await pecaRepo.getById(id);
    if (!p) throw new NotFoundException('Peça não encontrada');
    return this.buscarPeca.execute(p);
  }

  @ApiOperation({ summary: 'Listar pecas' })
  @ApiOkResponse({ description: 'Lista de pecas retornada com sucesso' })
  @Get()
  async listar() {
    return this.listarPeca.execute();
  }

  @ApiOperation({ summary: 'Ajustar estoque da peca' })
  @ApiParam({ name: 'id', description: 'Id da peca' })
  @ApiBody({ type: AjustarEstoquePecaDto })
  @ApiOkResponse({ description: 'Estoque ajustado com sucesso' })
  @Patch(':id/estoque')
  async ajustar(@Param('id') id: string, @Body() body: AjustarEstoquePecaDto) {
    const delta = Number(body?.delta);
    if (isNaN(delta))
      throw new BadRequestException('delta numérico obrigatório');
    try {
      return await this.ajustarEstoque.execute(id, delta);
    } catch (err: unknown) {
      throw new BadRequestException(getErrorMessage(err));
    }
  }
}
