import { ApiProperty } from '@nestjs/swagger';

export class CriarClienteDto {
  @ApiProperty({
    description: 'Nome completo do cliente',
    example: 'Joao da Silva',
  })
  nome!: string;

  @ApiProperty({
    description:
      'Documento do cliente (CPF com 11 digitos ou CNPJ com 14 digitos)',
    example: '12345678901',
  })
  documento!: string;
}
