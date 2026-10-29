import {
  UseGuards,
  Controller,
  Post,
  Body,
  Param,
  Get,
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
import { CriarOrdemServico } from '../../application/use-cases/criar-ordem-servico';
import { AdicionarItemOrdemServico } from '../../application/use-cases/adicionar-item-ordem-servico';
import { GerarOrcamento } from '../../application/use-cases/gerar-orcamento';
import { AprovarOrcamento } from '../../application/use-cases/aprovar-orcamento';
import { RecusarOrcamento } from '../../application/use-cases/recusar-orcamento';
import { IniciarExecucao } from '../../application/use-cases/iniciar-execucao';
import { IniciarDiagnostico } from '../../application/use-cases/iniciar-diagnostico';
import { FinalizarOrdemServico } from '../../application/use-cases/finalizar-ordem-servico';
import { EntregarVeiculo } from '../../application/use-cases/entregar-veiculo';
import { ListarOrdensServico } from '../../application/use-cases/listar-ordens-servico';
import {
  clienteRepo,
  veiculoRepo,
  ordemRepo,
  pecaRepo,
  servicoRepo,
  notificadorStatus,
  historicoStatusRepo,
  sagaPublisher,
} from '../../infraestructure/singletons';
import { ordensServicoCriadasTotal } from '../../infraestructure/observability/metrics-registry';
import {
  AdicionarItemOrdemServicoDto,
  CriarOrdemServicoDto,
  StatusOrdemServicoResponseDto,
  WebhookOrcamentoDto,
} from './dto/ordem-servico.dto';
import { STATUS_LABEL } from './status-os.label';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '../../auth/roles.enum';
import { getErrorMessage } from './error-message';

@Controller('os')
@ApiTags('ordens-servico')
export class OrdemServicoController {
  private criarOS = new CriarOrdemServico(ordemRepo, clienteRepo, veiculoRepo);
  private adicionarItem = new AdicionarItemOrdemServico(
    ordemRepo,
    pecaRepo,
    servicoRepo,
  );
  private gerarOrcamento = new GerarOrcamento(ordemRepo, notificadorStatus);
  private aprovarOrcamento = new AprovarOrcamento(ordemRepo, notificadorStatus);
  private recusarOrcamentoUC = new RecusarOrcamento(
    ordemRepo,
    notificadorStatus,
  );
  private iniciarExecucao = new IniciarExecucao(ordemRepo, notificadorStatus);
  private iniciarDiagnostico = new IniciarDiagnostico(
    ordemRepo,
    notificadorStatus,
  );
  private finalizarOrdem = new FinalizarOrdemServico(
    ordemRepo,
    notificadorStatus,
  );
  private entregarVeiculo = new EntregarVeiculo(ordemRepo, notificadorStatus);
  private listarOrdens = new ListarOrdensServico(ordemRepo);

  private repo = ordemRepo;
  private envioOrcamento = new Map<
    string,
    { status: 'NAO_ENVIADO' | 'ENVIADO'; enviadoEm?: string }
  >();
  private execucaoIniciadaEm = new Map<string, number>();
  private execucaoConcluidaMs = new Map<string, number>();

  @ApiOperation({ summary: 'Criar ordem de servico' })
  @ApiBody({ type: CriarOrdemServicoDto })
  @ApiOkResponse({ description: 'OS criada com sucesso' })
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ATENDENTE)
  @Post()
  async criar(@Body() body: CriarOrdemServicoDto) {
    try {
      const os = await this.criarOS.execute({
        clienteId: body?.clienteId,
        veiculoId: body?.veiculoId,
      });
      ordensServicoCriadasTotal.inc();
      await historicoStatusRepo.registrar(os.id, os.getStatus());
      await sagaPublisher.publicar(
        'OSCriadaEvent',
        {
          ordemServicoId: os.id,
          clienteId: os.clienteId,
          veiculoId: os.veiculoId,
          criadaEm: os.getCriadaEm().toISOString(),
        },
        os.id,
      );
      return os;
    } catch (err: unknown) {
      throw new BadRequestException(getErrorMessage(err));
    }
  }

  @ApiOperation({ summary: 'Adicionar item na ordem de servico' })
  @ApiParam({ name: 'id', description: 'Id da ordem de servico' })
  @ApiBody({ type: AdicionarItemOrdemServicoDto })
  @ApiOkResponse({ description: 'Item adicionado com sucesso' })
  @ApiNotFoundResponse({ description: 'OS não encontrada' })
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ATENDENTE)
  @Post(':id/item')
  async adicionar(
    @Param('id') id: string,
    @Body() body: AdicionarItemOrdemServicoDto,
  ) {
    const os = await this.repo.getById(id);
    if (!os) throw new NotFoundException('OS não encontrada');

    try {
      return await this.adicionarItem.execute(id, body);
    } catch (err: unknown) {
      throw new BadRequestException(getErrorMessage(err));
    }
  }

  @ApiOperation({ summary: 'Gerar orcamento da OS' })
  @ApiParam({ name: 'id', description: 'Id da ordem de servico' })
  @ApiOkResponse({ description: 'Orcamento gerado com sucesso' })
  @ApiNotFoundResponse({ description: 'OS não encontrada' })
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ATENDENTE)
  @Post(':id/orcamento')
  async gerar(@Param('id') id: string) {
    const os = await this.repo.getById(id);
    if (!os) throw new NotFoundException('OS não encontrada');

    try {
      const result = await this.gerarOrcamento.execute(id);
      await historicoStatusRepo.registrar(id, result.getStatus());
      await sagaPublisher.publicar(
        'OrcamentoGeradoEvent',
        {
          ordemServicoId: id,
          valorTotal: result.getValorTotal(),
          itens: result.getItens().map((item) => ({
            descricao: item.descricao,
            tipo: item.tipo,
            preco: item.preco,
            quantidade: item.quantidade,
          })),
          geradoEm: new Date().toISOString(),
        },
        id,
      );
      if (!this.envioOrcamento.has(id)) {
        this.envioOrcamento.set(id, { status: 'NAO_ENVIADO' });
      }
      return result;
    } catch (err: unknown) {
      throw new BadRequestException(getErrorMessage(err));
    }
  }

  @ApiOperation({ summary: 'Simular envio de orcamento ao cliente' })
  @ApiParam({ name: 'id', description: 'Id da ordem de servico' })
  @ApiOkResponse({ description: 'Orcamento marcado como enviado' })
  @ApiNotFoundResponse({ description: 'OS não encontrada' })
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ATENDENTE)
  @Post(':id/enviar-orcamento')
  async enviarOrcamento(@Param('id') id: string) {
    const os = await this.repo.getById(id);
    if (!os) throw new NotFoundException('OS não encontrada');

    if (os.getStatus() !== 'AGUARDANDO_APROVACAO') {
      throw new BadRequestException(
        'Só é possível enviar orçamento quando a OS está em AGUARDANDO_APROVACAO',
      );
    }

    const envio = {
      status: 'ENVIADO' as const,
      enviadoEm: new Date().toISOString(),
    };
    this.envioOrcamento.set(id, envio);

    return { ordemServicoId: id, ...envio };
  }

  @ApiOperation({ summary: 'Iniciar diagnostico da OS' })
  @ApiParam({ name: 'id', description: 'Id da ordem de servico' })
  @ApiOkResponse({ description: 'Diagnostico iniciado com sucesso' })
  @ApiNotFoundResponse({ description: 'OS não encontrada' })
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MECANICO)
  @Post(':id/diagnostico')
  async diagnostico(@Param('id') id: string) {
    const os = await this.repo.getById(id);
    if (!os) throw new NotFoundException('OS não encontrada');

    try {
      const result = await this.iniciarDiagnostico.execute(id);
      await historicoStatusRepo.registrar(id, result.getStatus());
      return result;
    } catch (err: unknown) {
      throw new BadRequestException(getErrorMessage(err));
    }
  }

  @ApiOperation({ summary: 'Aprovar orcamento da OS' })
  @ApiParam({ name: 'id', description: 'Id da ordem de servico' })
  @ApiOkResponse({ description: 'Orcamento aprovado com sucesso' })
  @ApiNotFoundResponse({ description: 'OS não encontrada' })
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ATENDENTE)
  @Post(':id/aprovar')
  async aprovar(@Param('id') id: string) {
    const os = await this.repo.getById(id);
    if (!os) throw new NotFoundException('OS não encontrada');

    try {
      const result = await this.aprovarOrcamento.execute(id);
      await historicoStatusRepo.registrar(id, result.getStatus());
      return result;
    } catch (err: unknown) {
      throw new BadRequestException(getErrorMessage(err));
    }
  }

  @ApiOperation({
    summary: 'Webhook de aprovacao ou recusa do orcamento pelo cliente',
  })
  @ApiParam({ name: 'id', description: 'Id da ordem de servico' })
  @ApiBody({ type: WebhookOrcamentoDto })
  @ApiOkResponse({ description: 'Orcamento processado com sucesso' })
  @ApiNotFoundResponse({ description: 'OS não encontrada' })
  @Post(':id/orcamento/webhook')
  async webhookOrcamento(
    @Param('id') id: string,
    @Body() body: WebhookOrcamentoDto,
  ) {
    const os = await this.repo.getById(id);
    if (!os) throw new NotFoundException('OS não encontrada');

    try {
      const result = body.aprovado
        ? await this.aprovarOrcamento.execute(id)
        : await this.recusarOrcamentoUC.execute(id);
      await historicoStatusRepo.registrar(id, result.getStatus());
      return result;
    } catch (err: unknown) {
      throw new BadRequestException(getErrorMessage(err));
    }
  }

  @ApiOperation({ summary: 'Iniciar execucao da OS' })
  @ApiParam({ name: 'id', description: 'Id da ordem de servico' })
  @ApiOkResponse({ description: 'Execucao iniciada com sucesso' })
  @ApiNotFoundResponse({ description: 'OS não encontrada' })
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MECANICO)
  @Post(':id/executar')
  async executar(@Param('id') id: string) {
    const os = await this.repo.getById(id);
    if (!os) throw new NotFoundException('OS não encontrada');

    try {
      const result = await this.iniciarExecucao.execute(id);
      await historicoStatusRepo.registrar(id, result.getStatus());
      this.execucaoIniciadaEm.set(id, Date.now());
      return result;
    } catch (err: unknown) {
      throw new BadRequestException(getErrorMessage(err));
    }
  }

  @ApiOperation({ summary: 'Finalizar ordem de servico' })
  @ApiParam({ name: 'id', description: 'Id da ordem de servico' })
  @ApiOkResponse({ description: 'OS finalizada com sucesso' })
  @ApiNotFoundResponse({ description: 'OS não encontrada' })
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MECANICO)
  @Post(':id/finalizar')
  async finalizar(@Param('id') id: string) {
    const os = await this.repo.getById(id);
    if (!os) throw new NotFoundException('OS não encontrada');

    try {
      const result = await this.finalizarOrdem.execute(id);
      await historicoStatusRepo.registrar(id, result.getStatus());
      const inicioExecucao = this.execucaoIniciadaEm.get(id);
      let tempoExecucaoMs: number | null = null;

      if (inicioExecucao) {
        tempoExecucaoMs = Date.now() - inicioExecucao;
        this.execucaoConcluidaMs.set(id, tempoExecucaoMs);
        this.execucaoIniciadaEm.delete(id);
      }

      return {
        id: result.id,
        status: result.getStatus(),
        tempoExecucaoMs,
      };
    } catch (err: unknown) {
      throw new BadRequestException(getErrorMessage(err));
    }
  }

  @ApiOperation({
    summary: 'Consultar SLA medio de atendimento (criacao -> finalizacao)',
  })
  @ApiOkResponse({
    description:
      'Métrica de SLA de atendimento (intervalo entre criação e finalização). Considera apenas OS em status FINALIZADA.',
  })
  @Get('sla-atendimento')
  async slaAtendimento() {
    const todas = await this.repo.all();
    const ordensConcluidas = todas.filter(
      (os) => os.getStatus() === 'FINALIZADA',
    );

    const totalOrdensConcluidas = ordensConcluidas.length;
    const totalSlaMs = ordensConcluidas.reduce((acc, os) => {
      const criadaEm = os.getCriadaEm();
      const finalizadaEm = os.getFinalizadaEm();
      if (!finalizadaEm) return acc;
      return acc + (finalizadaEm.getTime() - criadaEm.getTime());
    }, 0);

    const slaMedioAtendimentoMs =
      totalOrdensConcluidas === 0
        ? 0
        : Math.round(totalSlaMs / totalOrdensConcluidas);

    return { totalOrdensConcluidas, slaMedioAtendimentoMs };
  }

  @ApiOperation({ summary: 'Entregar veiculo da OS' })
  @ApiParam({ name: 'id', description: 'Id da ordem de servico' })
  @ApiOkResponse({ description: 'Veiculo entregue com sucesso' })
  @ApiNotFoundResponse({ description: 'OS não encontrada' })
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ATENDENTE)
  @Post(':id/entregar')
  async entregar(@Param('id') id: string) {
    const os = await this.repo.getById(id);
    if (!os) throw new NotFoundException('OS não encontrada');

    try {
      const result = await this.entregarVeiculo.execute(id);
      await historicoStatusRepo.registrar(id, result.getStatus());
      return result;
    } catch (err: unknown) {
      throw new BadRequestException(getErrorMessage(err));
    }
  }

  @ApiOperation({
    summary: 'Consultar status atual da OS (cliente acompanha sua propria OS)',
  })
  @ApiParam({ name: 'id', description: 'Id da ordem de servico' })
  @ApiOkResponse({ type: StatusOrdemServicoResponseDto })
  @ApiNotFoundResponse({ description: 'OS não encontrada' })
  @ApiBearerAuth('bearer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENTE, Role.ATENDENTE, Role.MECANICO)
  @Get(':id/status')
  async status(
    @Param('id') id: string,
  ): Promise<StatusOrdemServicoResponseDto> {
    const os = await this.repo.getById(id);
    if (!os) throw new NotFoundException('OS não encontrada');

    const status = os.getStatus();
    return {
      id: os.id,
      status,
      statusLabel: STATUS_LABEL[status],
    };
  }

  @ApiOperation({ summary: 'Buscar OS por id' })
  @ApiParam({ name: 'id', description: 'Id da ordem de servico' })
  @ApiOkResponse({ description: 'OS encontrada' })
  @ApiNotFoundResponse({ description: 'OS não encontrada' })
  @Get(':id')
  async buscar(@Param('id') id: string) {
    const os = await this.repo.getById(id);
    if (!os) throw new NotFoundException('OS não encontrada');
    return {
      ...os,
      envioOrcamento: this.envioOrcamento.get(id) || { status: 'NAO_ENVIADO' },
      tempoExecucaoMs: this.execucaoConcluidaMs.get(id) ?? null,
    };
  }

  @ApiOperation({
    summary: 'Listar ordens de servico (ordenadas por prioridade)',
  })
  @ApiOkResponse({
    description:
      'Lista de OS retornada com sucesso (FINALIZADA/ENTREGUE ocultas)',
  })
  @Get()
  async listar() {
    const ordens = await this.listarOrdens.execute();
    return ordens.map((os) => ({
      ...os,
      envioOrcamento: this.envioOrcamento.get(os.id) || {
        status: 'NAO_ENVIADO',
      },
      tempoExecucaoMs: this.execucaoConcluidaMs.get(os.id) ?? null,
    }));
  }
}
