import { ApiProperty } from '@nestjs/swagger';

export class CriarServicoDto {
  @ApiProperty({ description: 'Nome do servico', example: 'Troca de oleo' })
  nome!: string;

  @ApiProperty({ description: 'Preco base do servico', example: 120.5 })
  preco!: number;
}
