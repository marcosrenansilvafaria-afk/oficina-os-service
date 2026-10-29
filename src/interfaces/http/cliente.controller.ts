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
import { CriarCliente } from '../../application/use-cases/criar-cliente';
import { BuscarCliente } from '../../application/use-cases/buscar-cliente';
import { clienteRepo } from '../../infraestructure/singletons';
import { CriarClienteDto } from './dto/cliente.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { getErrorMessage } from './error-message';

@Controller('clientes')
@ApiTags('clientes')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
export class ClienteController {
  private criarCliente = new CriarCliente(clienteRepo);
  private buscarCliente = new BuscarCliente();
  private repo = clienteRepo;

  private validarDocumento(documento: string) {
    const documentoNumerico = String(documento || '').replace(/\D/g, '');
    if (documentoNumerico.length !== 11 && documentoNumerico.length !== 14) {
      throw new BadRequestException('documento inválido (use CPF/CNPJ)');
    }
    return documentoNumerico;
  }

  @ApiOperation({ summary: 'Criar cliente' })
  @ApiBody({ type: CriarClienteDto })
  @ApiOkResponse({ description: 'Cliente criado com sucesso' })
  @Post()
  async criar(@Body() body: CriarClienteDto) {
    if (!body || !body.nome || !body.documento) {
      throw new BadRequestException('nome e documento são obrigatórios');
    }

    try {
      const documento = this.validarDocumento(body.documento);
      return await this.criarCliente.execute({ nome: body.nome, documento });
    } catch (err: unknown) {
      throw new BadRequestException(getErrorMessage(err));
    }
  }

  @ApiOperation({ summary: 'Buscar cliente por id' })
  @ApiParam({ name: 'id', description: 'Id do cliente' })
  @ApiOkResponse({ description: 'Cliente encontrado' })
  @ApiNotFoundResponse({ description: 'Cliente não encontrado' })
  @Get(':id')
  async buscar(@Param('id') id: string) {
    const cliente = await this.repo.getById(id);
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    return this.buscarCliente.execute(cliente);
  }

  @ApiOperation({ summary: 'Listar clientes' })
  @ApiOkResponse({ description: 'Lista de clientes retornada com sucesso' })
  @Get()
  async listar() {
    return this.repo.all();
  }
}
