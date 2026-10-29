import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { StatusOrdemServico } from '../../../domain/entities/ordem-servico';

export class StatusOrdemServicoResponseDto {
  @ApiProperty({ example: '8f42d860-a4f4-4cb5-a2d7-2d8bc7fbf9f3' })
  id!: string;

  @ApiProperty({
    enum: [
      'RECEBIDA',
      'EM_DIAGNOSTICO',
      'AGUARDANDO_APROVACAO',
      'APROVADA',
      'EM_EXECUCAO',
      'FINALIZADA',
      'ENTREGUE',
    ],
  })
  status!: StatusOrdemServico;

  @ApiProperty({ example: 'Em Execução' })
  statusLabel!: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  atualizadoEm?: string;
}

export class WebhookOrcamentoDto {
  @ApiProperty({
    description: 'true para aprovar, false para recusar o orçamento',
    example: true,
  })
  aprovado!: boolean;
}

export class CriarOrdemServicoDto {
  @ApiPropertyOptional({
    description: 'Identificador do cliente previamente cadastrado',
    example: '8f42d860-a4f4-4cb5-a2d7-2d8bc7fbf9f3',
  })
  clienteId?: string;

  @ApiPropertyOptional({
    description: 'Identificador do veiculo previamente cadastrado',
    example: '9f8a40f9-1b21-45a4-9d9e-1d46831f2630',
  })
  veiculoId?: string;
}

export class AdicionarItemOrdemServicoDto {
  @ApiProperty({
    description: 'Tipo do item da ordem de servico',
    enum: ['PECA', 'SERVICO'],
    example: 'SERVICO',
  })
  tipo!: 'PECA' | 'SERVICO';

  @ApiPropertyOptional({
    description:
      'Descricao manual do item (usado quando nao informar pecaId/servicoId)',
    example: 'Troca de oleo',
  })
  descricao?: string;

  @ApiPropertyOptional({
    description:
      'Preco unitario do item (usado quando nao informar pecaId/servicoId)',
    example: 120,
  })
  preco?: number;

  @ApiProperty({
    description: 'Quantidade do item',
    example: 1,
    minimum: 1,
  })
  quantidade!: number;

  @ApiPropertyOptional({
    description: 'Id da peca do catalogo',
    example: '32938fbc-a856-4d8d-bbf0-39d282a4c9f8',
  })
  pecaId?: string;

  @ApiPropertyOptional({
    description: 'Id do servico do catalogo',
    example: '2f4a9ce6-9acd-4f56-a21e-1188f27ac3eb',
  })
  servicoId?: string;
}
