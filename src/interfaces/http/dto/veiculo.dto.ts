import { ApiProperty } from '@nestjs/swagger';

export class CriarVeiculoDto {
  @ApiProperty({
    description: 'Placa do veiculo (formatos aceitos: ABC1D23 ou ABC-1234)',
    example: 'ABC1D23',
  })
  placa!: string;

  @ApiProperty({ description: 'Modelo do veiculo', example: 'Onix' })
  modelo!: string;

  @ApiProperty({ description: 'Marca do veiculo', example: 'Chevrolet' })
  marca!: string;

  @ApiProperty({ description: 'Ano de fabricacao/modelo', example: 2022 })
  ano!: number;
}
