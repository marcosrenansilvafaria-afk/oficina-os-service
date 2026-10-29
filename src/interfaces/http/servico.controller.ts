import {
  UseGuards,
  Controller,
  Post,
  Body,
  Get,
  Param,
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
import { CriarServico } from '../../application/use-cases/criar-servico';
import { BuscarServico } from '../../application/use-cases/buscar-servico';
import { ListarServico } from '../../application/use-cases/listar-servico';
import { servicoRepo } from '../../infraestructure/singletons';
import { CriarServicoDto } from './dto/servico.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { getErrorMessage } from './error-message';

@Controller('servicos')
@ApiTags('servicos')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
export class ServicoController {
  private criarServico = new CriarServico(servicoRepo);
  private buscarServico = new BuscarServico();
  private listarServico = new ListarServico(servicoRepo);

  @ApiOperation({ summary: 'Criar servico' })
  @ApiBody({ type: CriarServicoDto })
  @ApiOkResponse({ description: 'Servico criado com sucesso' })
  @Post()
  async criar(@Body() body: CriarServicoDto) {
    try {
      return await this.criarServico.execute({
        nome: body.nome,
        preco: body.preco,
      });
    } catch (err: unknown) {
      throw new BadRequestException(getErrorMessage(err));
    }
  }

  @ApiOperation({ summary: 'Buscar servico por id' })
  @ApiParam({ name: 'id', description: 'Id do servico' })
  @ApiOkResponse({ description: 'Servico encontrado' })
  @ApiNotFoundResponse({ description: 'Serviço não encontrado' })
  @Get(':id')
  async buscar(@Param('id') id: string) {
    const s = await servicoRepo.getById(id);
    if (!s) throw new NotFoundException('Serviço não encontrado');
    return this.buscarServico.execute(s);
  }

  @ApiOperation({ summary: 'Listar servicos' })
  @ApiOkResponse({ description: 'Lista de servicos retornada com sucesso' })
  @Get()
  async listar() {
    return this.listarServico.execute();
  }
}
