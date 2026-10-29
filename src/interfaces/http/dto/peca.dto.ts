import { ApiProperty } from '@nestjs/swagger';

export class CriarPecaDto {
  @ApiProperty({ description: 'Nome da peca', example: 'Filtro de oleo' })
  nome!: string;

  @ApiProperty({ description: 'Preco unitario da peca', example: 45.9 })
  preco!: number;

  @ApiProperty({ description: 'Quantidade inicial em estoque', example: 10 })
  estoque!: number;
}

export class AjustarEstoquePecaDto {
  @ApiProperty({
    description:
      'Variacao do estoque (positivo para entrada, negativo para saida)',
    example: -1,
  })
  delta!: number;
}
